//
// teamData.cpp
//

#include "teamData.hh"
#include "attribute.hh"
#include <exception>
#include "assert.h"

///////////////////////////////////////////////////////////////////////////////
// Entity

// Constructor
Entity::Entity(Entity::Type type) :
	type(type)
{
}

///////////////////////////////////////////////////////////////////////////////
// Member

// Constructor
Member::Member(Person& person) :
	Entity(Entity::MEMBER),
	person(person)
{
}

///////////////////////////////////////////////////////////////////////////////
// TeamLevel

// Constructor
TeamLevel::TeamLevel(int level) :
	Entity(Entity::TEAM),
	level(level)
{
}

void TeamLevel::add_member(Entity* member) 
{
    members.push_back(member);
}

///////////////////////////////////////////////////////////////////////////////
// Partition

// Constructor
Partition::Partition(const AllTeamData& allTeamData, const string& name, int numPeople) :
	Entity(Entity::PARTITION),
	allTeamData(allTeamData),
	name(name),
	cost(0.0),
	bestCost(0.0)
{
    allMembers.reserve(numPeople);
}

// Other member functions
void Partition::add_member(Member* member)
{
    allMembers.push_back(member);
}

void Partition::populate_random_teams()
{
    vector<Level*>& allLevels = allTeamData.allLevels;

    assert(highestLevelTeams.size() == 0);
    assert(lowestLevelTeams.size() == 0);

    // Work out our lowest level - use a reverse iterator.
    vector<Level*>::reverse_iterator levelItr = allLevels.rbegin(); 
    // Work out how many teams we need at the lowest level
    int numTeams = AllTeamData::number_of_teams(allMembers.size(), (*levelItr)->get_min_size(),
	    (*levelItr)->get_ideal_size(), (*levelItr)->get_max_size());
    // Reserve space for these teams
    lowestLevelTeams.reserve(numTeams);
    // Create all the necessary empty teams
    for(int i = 0; i < numTeams; i++) {
	lowestLevelTeams.push_back(new TeamLevel((*levelItr)->get_level_num()));
    }
    // Iterate over all the members and put them in teams one by one
    for(int i = 0; i < allMembers.size(); ++i) 
    {
	lowestLevelTeams[i % numTeams]->add_member(allMembers[i]);
    }

    // Copy our list of teams at this level - this becomes our members for teams at the
    // next level up (if there is one). This is the highest level list for now.
    highestLevelTeams = lowestLevelTeams;
    // Continue working up our levels
    ++levelItr;
    while(levelItr != allLevels.rend()) {
	numTeams = AllTeamData::number_of_teams(highestLevelTeams.size(), (*levelItr)->get_min_size(),
		(*levelItr)->get_ideal_size(), (*levelItr)->get_max_size());
	vector<TeamLevel*> currentLevelTeams;
	// Reserve space for these teams
	currentLevelTeams.reserve(numTeams);
	// Create all the necessary empty teams
	for(int i = 0; i < numTeams; i++) {
	    currentLevelTeams.push_back(new TeamLevel((*levelItr)->get_level_num()));
	}
	// Iterate over all the members and put them in teams one by one
	for(int i = 0; i < highestLevelTeams.size(); ++i) 
	{
	    currentLevelTeams[i % numTeams]->add_member(highestLevelTeams[i]);
	}
	// Copy this list of teams as our members for the next level up (if there is one)
	highestLevelTeams = currentLevelTeams;
    }
}

void Partition::populate_existing_teams()
{
}

///////////////////////////////////////////////////////////////////////////////
// AllTeamData

// Constructor
AllTeamData::AllTeamData(AnnealInfo& annealInfo) :
	allLevels(annealInfo.all_levels())
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
	    // Create a new partition with the given name
	    partitionMap.insert(pair<const string,Partition*>(*itr, new Partition(annealInfo,
		    *itr, 
		    annealInfo.count_people_with_attribute_value(partitionAttribute, *itr))));
	}
    } else {
	// No partitions - just create one with an empty name
	partition = new Partition(annealInfo, "", annealInfo.num_people());
	partitionMap.insert(pair<const string, Partition*>("", partition));
    }

    // Reserve space for the members we will have
    allMembers.reserve(annealInfo.num_people());

    // Iterate over all the people to build up our list of members
    for(vector<Person*>::iterator it = annealInfo.all_people().begin();
	    it != annealInfo.all_people().end(); ++it) {
	Member* member = new Member(**it);
	allMembers.push_back(member);
	// Work out which partition they go in
	if(partitionAttribute) {
	    partition = find_partition((*it)->get_string_attribute_value(partitionAttribute));
	} // else, no partitions. partition variable already holds a pointer to our one dummy partition
	partition->add_member(member);
    }
}

void AllTeamData::populate_random_teams()
{
    // Iterate over each partition
    for(map<string,Partition*>::iterator it = partitionMap.begin(); it != partitionMap.end(); ++it) {
	it->second->populate_random_teams();
    }
}

void AllTeamData::populate_existing_teams()
{
    // Iterate over each partition
    for(map<string,Partition*>::iterator it = partitionMap.begin(); it != partitionMap.end(); ++it) {
	it->second->populate_existing_teams();
    }
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
