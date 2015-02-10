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
	// Get associated member 
	Member* member = partition->get_member_for_person(*itr);

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
	TeamLevel* lowestLevelTeam = member->get_parent();
        TeamLevel* team = lowestLevelTeam;
        do {
	    row->append(team->get_name());
            TeamLevel* parentTeam = team->get_parent();
	    assert(parentTeam);
            team = parentTeam;
        }
        while (!team->is_partition());
	
	row->append(lowestLevelTeam->get_full_team_name());

        // Move on to next person
        ++itr;
    }
    ofstream ofs(filename);
    ofs << (*csvFile);
}
