//
// teamData.cpp
//

#include "teamData.hh"
#include "attribute.hh"
#include <exception>
#include "assert.h"
#include "exceptions.hh"

///////////////////////////////////////////////////////////////////////////////
// AllTeamData

// Constructor
AllTeamData::AllTeamData(AnnealInfo& annealInfo) :
	annealInfo(annealInfo)
{
    Partition* partition;

    // Create partitions
    Attribute* partitionAttribute = annealInfo.get_partition_field();

    if(partitionAttribute) {
	// Iterate over all the values for this attribute and create a partition
	// for each
	for(Attribute::ValueIterator itr = partitionAttribute->iterator(); 
		itr != partitionAttribute->end(); ++itr) {
	    // itr will be a const string*
	    // Create a new partition with the given name. The associated level is level 0.
	    Partition* partition = new Partition(this, get_level(0), *itr, 
		    annealInfo.count_people_with_attribute_value(partitionAttribute, *itr));
	    partitionMap.insert(pair<const string,Partition*>(*itr, partition));
	    partitionList.append(partition);
	}
    } else {
	// No partitions - just create one with an empty name
	string* partitionNamePtr = new string("");
	partition = new Partition(this, get_level(0), *partitionNamePtr, annealInfo.num_people());
	partitionMap.insert(pair<const string, Partition*>("", partition));
	partitionList.append(partition);
    }

    // Iterate over all the people to build up our list of members
    for(vector<const Person*>::iterator it = annealInfo.all_people().begin();
	    it != annealInfo.all_people().end(); ++it) {
	// Work out which partition they go in
	if(partitionAttribute) {
	    partition = find_partition((*it)->get_string_attribute_value(partitionAttribute));
	} // else, no partitions. partition variable already holds a pointer to our one dummy partition

	partition->add_person(*it);
	personToPartitionMap.insert(pair<const Person*,Partition*>(*it,partition));
    }
}

AnnealInfo& AllTeamData::get_anneal_info()
{
    return annealInfo;
}

void AllTeamData::populate_random_teams()
{
    // Iterate over each partition
    EntityListIterator itr(partitionList);
    while(!itr.done()) {
	((Partition*)itr)->populate_random_teams();
	((Partition*)itr)->set_current_teams_as_lowest_cost();
	++itr;
    }
}

void AllTeamData::populate_existing_teams()
{
    // Iterate over each partition
    EntityListIterator itr(partitionList);
    while(!itr.done()) {
	((Partition*)itr)->populate_existing_teams();
	((Partition*)itr)->set_current_teams_as_lowest_cost();
	++itr;
    }
}

bool AllTeamData::has_partitions() const
{
    return (annealInfo.get_partition_field() != nullptr);
}

Partition* AllTeamData::find_partition(const string& name)
{
    map<string,Partition*>::iterator it;
    it = partitionMap.find(name);
    if(it == partitionMap.end()) {
	// Partition not found
	return nullptr;
    } else {
	return it->second;
    }
}

int AllTeamData::num_levels() const
{
    // We subtract one from the size of the level array since the level array also 
    // contains the partition
    return annealInfo.num_levels();
}

const Level& AllTeamData::get_level(int levelNum) const
{
    return *(annealInfo.get_level(levelNum));
}

const vector<Level*>& AllTeamData::all_levels() const
{
    return annealInfo.all_levels();
}

const vector<Constraint*>& AllTeamData::all_constraints() const
{
    return annealInfo.all_constraints();
}

vector<const Person*>& AllTeamData::all_people() const
{
    return annealInfo.all_people();
}

Partition* AllTeamData::get_partition_for_person(const Person* person) const
{
    map<const Person*,Partition*>::const_iterator it = personToPartitionMap.find(person);
    assert(it != personToPartitionMap.end()); // partition must be found
    return it->second;
}

EntityListIterator AllTeamData::get_partition_iterator() const
{
    return EntityListIterator(partitionList);
}

void AllTeamData::set_names_for_all_teams()
{
    // Iterate over each person
    vector<const Person*>& allPeople = annealInfo.all_people();
    vector<const Person*>::const_iterator itr = allPeople.begin();
    while(itr != allPeople.end()) {
        // Get partition that person is part of
        Partition* partition = get_partition_for_person(*itr);
        // Get associated member (of the lowest cost teams)
        Member* member = partition->get_member_for_person(*itr);

        // Construct the team names - one for each level - build up a vector with these
        // for use in constructing the overall team name
        int numLevels = 0;
        TeamLevel* lowestLevelTeam = member->get_parent();
        TeamLevel* team = lowestLevelTeam;
        vector<string> levelNames;
        do {
            numLevels++;
            // Get number of this team within the list of teams
            TeamLevel* parentTeam = team->get_parent();
            assert(parentTeam);
            int teamNum = parentTeam->find_index_of(team);
            // Get the name and set it and save it to our list of level names
            string teamNameAtThisLevel = 
                    team->get_level().get_name(teamNum, parentTeam->num_children());
            teamNameAtThisLevel = team->set_name(teamNameAtThisLevel);	// will happen if not already set
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
            assert(level < 10); // we can only handle single digit levels
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
        lowestLevelTeam->set_full_team_name(teamName);

        // Move on to next person
        ++itr;
    }
}

// Output operator
ostream& operator<<(ostream& os, const AllTeamData& all)
{
    for(map<string,Partition*>::const_iterator it = all.partitionMap.begin(); it != all.partitionMap.end(); ++it) {
	it->second->output(os);
	os << "-----" << endl;
    }
    return os;
}

// static member
int AllTeamData::number_of_teams(int numMembers, int minSize, int idealSize, 
	int maxSize, bool favourSmaller)
{
    // Default value for numTeams may get adjusted as we go
    int numTeams = numMembers / idealSize;	// number of ideal size teams
    int numLeftOver = numMembers % idealSize;	// number of people left over


    if(numLeftOver == 0) {
	// All teams can be ideal size 
    } else if(minSize == idealSize && idealSize == maxSize) {
	// overconstrained - throw Exception
	throw ("Not all teams can be the ideal size");
    } else if(minSize == idealSize && idealSize < maxSize) {
	// Teams can be larger than ideal but not smaller. Excess members
	// will get distributed amongst existing teams
    } else if(minSize < idealSize && idealSize == maxSize) {
	// Teams can be smaller but not larger. We'll need one additional team
	// to hold our excess members + some taken from other teams
	numTeams++;
    } else {
	// Possibly underconstrained - we can have larger or smaller teams. We
	// favour minimising the number of non-ideal teams and making sizes as 
	// close to ideal as possible (plus or minus 1). NOTE: We ignore the 
	// possibility of teams being more than 1 different from the ideal
	if(idealSize % 2 == 0 && numLeftOver == (idealSize / 2)) {
	    //We have exactly half a team left over - we could go smaller or larger
	    if(favourSmaller && ((minSize - numLeftOver) <= numTeams)) {
		// We can extract one from each of other teams to make up the difference
		numTeams++;
	    } else if(numMembers > numTeams * maxSize) {
		// Can't fit everyone in maximum size teams - try adding one more team
		numTeams++;
	    } else {
		// go larger - Excess team members will get distributed amongst
		// existing teams
	    }
	} else if(numLeftOver > (idealSize / 2) && ((minSize - numLeftOver) <= numTeams)) {
	    // We have more than half a team worth of members left over and we have enough teams
	    // to take one member each from - favour making teams smaller
	    numTeams++;
	} else if(numMembers > numTeams * maxSize) {
	    // Can't fit everyone in maximum size teams - try adding one more
	    numTeams++;
	} else {
	    // Favour making teams larger - left over team members distributed 
	    // amongst other teams
	}
    }
    if(numMembers < numTeams * minSize || numMembers > numTeams * maxSize) {
	// We can't make this work - throw an exception to indicate error
	throw ("Can't meet team size contraints");
    }
    return numTeams;
}
