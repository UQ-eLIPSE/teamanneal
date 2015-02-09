//
// csv_output.cpp
//

#include "csv_output.hh"
#include <assert.h>
#include <fstream>
#include "csv.hh"

void output_csv_file_from_team_data(AllTeamData* data, const char* filename)
{
    CSV_File* csvFile = new CSV_File();

    AnnealInfo& annealInfo = data->get_anneal_info();

    // Add column names for the attributes (columns have already been renamed if necessary)
    for(int i=0; i < annealInfo.num_attributes(); ++i) {
	csvFile->add_column(annealInfo.get_attribute(i)->get_name());
    }

    // Now for level names (ignoring partition) - we work from the bottom level towards the top
    for(int i=annealInfo.num_levels(); i>= 1;  --i) {
	csvFile->add_column(annealInfo.get_level(i)->get_field_name());
    }

    // Now for the overall team name 
    csvFile->add_column(annealInfo.get_team_name_field());

    // Iterate over each person
    vector<const Person*>& allPeople = data->all_people();
    vector<const Person*>::const_iterator itr = allPeople.begin();
    while(itr != allPeople.end()) {
	// Get partition that person is part of
	Partition* partition = data->get_partition_for_person(*itr);
	// Get associated member (of the lowest cost teams)
	Member* member = partition->get_lowest_cost_member_for_person(*itr);

	const Person& person = **itr;

        CSV_Row* row = new CSV_Row();
        csvFile->add_row(row);
        // Iterate over each attribute and output that value (this is as read in)
        for(int i=0; i < annealInfo.num_attributes(); ++i) {
            Attribute* attr = annealInfo.get_attribute(i);
            row->append(person.get_string_attribute_value(attr));
        }
        // Output the team names - one for each level - build up a vector with these
	// for use in constructing the overall team name
        int numLevels = 0;
        TeamLevel* team = member->get_parent();
	vector<string> levelNames;
        do {
            numLevels++;
            // Get number of this team within the list of teams
            TeamLevel* parentTeam = team->get_parent();
	    assert(parentTeam);
            int teamNum = parentTeam->find_index_of(team);
            // Append the name of the team to the CSV row - the level can generate the
            // name based on the team number. Prepend the name to our vector of names
	    string teamNameAtThisLevel = 
		    team->get_level().get_name(teamNum, parentTeam->num_children());
            row->append(teamNameAtThisLevel);
	    team->set_name(teamNameAtThisLevel);
	    levelNames.insert(levelNames.begin(), teamNameAtThisLevel);
            // Get ready to move up a level
            team = parentTeam;
        }
        while (!team->is_partition());
        // Check we haven't run out of levels - there must be this many parent teams
        assert(numLevels == annealInfo.num_levels());
	
	// prepend our partition name to our vector of level names - in case it is needed
	levelNames.insert(levelNames.begin(), team->get_name());

        // Output the overall name
	string teamName = annealInfo.get_team_name_format();
	// For each level, replace any instance of %levelNum (e.g. %0) with the name of the team
	// at that level. Level 0 = partition
	for(int level = 0; level < levelNames.size(); level++) {
	    assert(level < 10);	// we can only handle single digit levels
	    string escapeSequence = "%";
	    escapeSequence += to_string(level);
	    // Look for escape sequence in the team name format
	    size_t posn = teamName.find(escapeSequence);
	    while(posn != string::npos) {
		// escape sequence has been found - replace it by the team name at this level
		teamName.replace(posn, 2, levelNames[level]);
		// Look for another match
		posn = teamName.find(escapeSequence);
	    }
	}
	row->append(teamName);
	FIX need to save this team name

        // Move on to next person
        ++itr;
    }
    ofstream ofs(filename);
    ofs << (*csvFile);
}
