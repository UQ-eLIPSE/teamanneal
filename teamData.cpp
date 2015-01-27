//
// teamData.cpp
//

#include "teamData.hh"
#include "attribute.hh"
#include <exception>
#include "assert.h"

static string emptyString("");

///////////////////////////////////////////////////////////////////////////////
// Entity

// Constructors
Entity::Entity(Entity::Type type, const string& name) :
	type(type),
	name(name)
{
}

Entity::Entity(Entity::Type type) :
	type(type),
	name(emptyString)
{
}

bool Entity::has_name(const string& value) const
{
    return (name == value);
}

Entity::Type Entity::get_type() const
{
    return type;
}

///////////////////////////////////////////////////////////////////////////////
// EntityList

void EntityList::append(Entity* member)
{
    members.push_back(member);
}

// Not very efficient
void EntityList::append_unique(Entity* member)
{
    EntityListIterator itr(*this);
    while(!itr.done()) {
	if((Entity*)itr == member) {
	    return;
	}
	++itr;
    }

    // Did not find member - add it
    members.push_back(member);
}

Entity*& EntityList::operator[](size_t i)
{
    return members[i];
}

Entity* EntityList::find_entity_with_name(const string& name)
{
    // search the vector to find the entity
    for(EntityListIterator it = list_iterator(); !it.done(); ++it) {
	if(it->has_name(name)) {
	    return it;
	}
    }
    // Not found
    return nullptr;
}

size_t EntityList::size() const
{
    return members.size();
}

void EntityList::reserve(size_t size)
{
    members.reserve(size);
}

TeamLevel* EntityList::get_subteam(size_t i)
{
    Entity* element = members[i];
    assert(element->get_type() == Entity::TEAM);
    return (TeamLevel*)element;
}

EntityListIterator EntityList::list_iterator() const
{
    return EntityListIterator(*this);
}

///////////////////////////////////////////////////////////////////////////////
// EntityListIterator

// Constructor
EntityListIterator::EntityListIterator(const EntityList& list) :
	list(list),
	entityNum(0)
{
}

Entity& EntityListIterator::operator*()
{
    return *(list.members[entityNum]);
}

Entity* EntityListIterator::operator->()
{
    return list.members[entityNum];
}

EntityListIterator::operator Entity*() const
{
    return list.members[entityNum];
}

EntityListIterator& EntityListIterator::operator++()
{
    entityNum++;
    return (*this);
}

EntityListIterator EntityListIterator::operator++(int)	// postfix
{
    EntityListIterator tmp(*this);		// Copy iterator to preserve state before increment
    entityNum++;
    return tmp;
}

bool EntityListIterator::done() 
{
    return entityNum > list.size();
}

///////////////////////////////////////////////////////////////////////////////
// Member

// Constructor
Member::Member(Person& person) :
	Entity(Entity::MEMBER, person.get_id()),
	person(person)
{
}

const string& Member::get_attribute_value(const Attribute* attr) 
{
    return person.get_string_attribute_value(attr);
}

///////////////////////////////////////////////////////////////////////////////
// TeamLevel

// Constructors
TeamLevel::TeamLevel(const Level& level) :
	Entity(Entity::TEAM),
	level(level)
{
}

TeamLevel::TeamLevel(const Level& level, const string& teamName) :
	Entity(Entity::TEAM, teamName),
	level(level) 
{
}

void TeamLevel::add_member(Entity* member) 
{
    members.append(member);
}

TeamLevel* TeamLevel::create_or_get_named_subteam(const string& subTeamName) 
{
    // Make sure this isn't the lowest level (i.e. there must be subteams)
    assert(!level.is_lowest());

    // Look for existing sub-team with the given name
    TeamLevel* team = (TeamLevel*)members.find_entity_with_name(subTeamName);
    if(!team) {
	// Not found - create a new subteam with the given name
	team = new TeamLevel(*(level.get_child_level()), subTeamName);
	members.append(team);
    }
    return team;
}

const Level& TeamLevel::get_level() const
{
    return level;
}

///////////////////////////////////////////////////////////////////////////////
// Partition

// Constructor
Partition::Partition(AllTeamData* allTeamData, const string& name, int numPeople) :
	Entity(Entity::PARTITION, name),
	allTeamData(allTeamData),
	cost(0.0),
	bestCost(0.0)
{
    allMembers.reserve(numPeople);
}

// Other member functions
void Partition::add_member(Member* member)
{
    allMembers.append(member);
}

void Partition::populate_random_teams()
{
    vector<Level*>& allLevels = allTeamData->allLevels;

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
	lowestLevelTeams.append(new TeamLevel(**levelItr));
    }
    // Iterate over all the members and put them in teams one by one
    for(int i = 0; i < allMembers.size(); ++i) 
    {
	lowestLevelTeams.get_subteam(i % numTeams)->add_member(allMembers[i]);
    }

    // Copy our list of teams at this level - this becomes our members for teams at the
    // next level up (if there is one). This is the highest level list for now.
    highestLevelTeams = lowestLevelTeams;
    // Continue working up our levels
    while(!(*levelItr)->is_highest()) {
	++levelItr;
	numTeams = AllTeamData::number_of_teams(highestLevelTeams.size(), (*levelItr)->get_min_size(),
		(*levelItr)->get_ideal_size(), (*levelItr)->get_max_size());
	EntityList currentLevelTeams;
	// Reserve space for these teams
	currentLevelTeams.reserve(numTeams);
	// Create all the necessary empty teams
	for(int i = 0; i < numTeams; i++) {
	    currentLevelTeams.append(new TeamLevel(**levelItr));
	}
	// Iterate over all the members and put them in teams one by one
	for(int i = 0; i < highestLevelTeams.size(); ++i) {
	    currentLevelTeams.get_subteam(i % numTeams)->add_member(highestLevelTeams[i]);
	}
	// Copy this list of teams as our members for the next level up (if there is one)
	highestLevelTeams = currentLevelTeams;
    }
}

void Partition::populate_existing_teams()
{
    // Work from the top level down
    // Iterate over all the members in the partition
    for(int i = 0; i < allMembers.size(); ++i) {
	// Iterate over all the attributes of the member which are the names of the levels
	// We iterate from the top level down
	TeamLevel* teamAtLevel = nullptr;
	bool unallocated = false;
	for(int levelNum = 1; levelNum <= allTeamData->num_levels(); levelNum++) {
	    // Get the attribute for this level (there should be one in our team file - it
	    // is an error if not)
	    Attribute* levelAttribute = allTeamData->get_level(levelNum).get_field_attribute();
	    // FIX - check earlier that attributes are present if we're using pre-existing teams?
	    assert(levelAttribute);

	    // Get the value of this attribute for this person - it's possible the value is blank
	    const string& teamLevelName = ((Member*)allMembers[i])->get_attribute_value(levelAttribute);
	    // If the value is blank (at any level), this person is unallocated - abort - do not
	    // create any more teams at any level for this person
	    if(teamLevelName == "") {
		unallocated = true;
		break;
	    }

	    if(levelNum == 1) {
		// This is the top level, search the partition for a team with this name or 
		// create one
		teamAtLevel = create_or_get_named_team(teamLevelName);
	    } else {
		// Sub-level - search for team with this name
		teamAtLevel = teamAtLevel->create_or_get_named_subteam(teamLevelName);
	    }
	    if(levelNum == allTeamData->num_levels()) {
		// At lowest level - add the team to our list of lowest level teams
		// if we haven't already
		lowestLevelTeams.append_unique(teamAtLevel);
	    }
	}
	if(unallocated) {
	    // Person wasn't allocated to a team (one of the team names at some level was blank).
	    unallocatedMembers.append(allMembers[i]);
	} else {
	    // We've made our way to the bottom level - add the person as a member
	    teamAtLevel->add_member(allMembers[i]);
	}
    }
}

TeamLevel* Partition::create_or_get_named_team(const string& teamName) 
{
    TeamLevel* team = (TeamLevel*)highestLevelTeams.find_entity_with_name(teamName);
    if(!team) {
	// Team doesn't exist - create one with that name
	team = new TeamLevel(allTeamData->get_level(1), teamName);
	highestLevelTeams.append(team);
    }
    return team;
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
	    partitionMap.insert(pair<const string,Partition*>(*itr, new Partition(this, *itr, 
		    annealInfo.count_people_with_attribute_value(partitionAttribute, *itr))));
	}
    } else {
	// No partitions - just create one with an empty name
	partition = new Partition(this, "", annealInfo.num_people());
	partitionMap.insert(pair<const string, Partition*>("", partition));
    }

    // Reserve space for the members we will have
    allMembers.reserve(annealInfo.num_people());

    // Iterate over all the people to build up our list of members
    for(vector<Person*>::iterator it = annealInfo.all_people().begin();
	    it != annealInfo.all_people().end(); ++it) {
	Member* member = new Member(**it);
	allMembers.append(member);
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

int AllTeamData::num_levels() const
{
    // We subtract one from the size of the level array since the level array also 
    // contains the partition
    return allLevels.size() - 1;
}

const Level& AllTeamData::get_level(int levelNum) const
{
    return *(allLevels[levelNum]);
}

void AllTeamData::output(const char* filename)
{
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
