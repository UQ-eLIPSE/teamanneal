//
// teamData.cpp
//

#include "teamData.hh"
#include "person.hh"
#include "attribute.hh"
#include <exception>
#include <fstream>
#include "assert.h"
#include "exceptions.hh"

static string emptyString("");

///////////////////////////////////////////////////////////////////////////////
// Entity

// Constructors
Entity::Entity(Entity::Type type, Partition* partition) :
	type(type),
	name(emptyString),
	parent(nullptr),	// no parent by default
	partition(partition)
{
}

Entity::Entity(Entity::Type type, const string& name, Partition* partition) :
	type(type),
	name(name),
	parent(nullptr),
	partition(partition)
{
}

// Destructor - nothing to be done, but we need this since the destructor is pure virtual
Entity::~Entity()
{
}

bool Entity::has_name(const string& value) const
{
    return (name == value);
}

const string& Entity::get_name() const
{
    return name;
}

Entity::Type Entity::get_type() const
{
    return type;
}

void Entity::set_parent(TeamLevel* team)
{
    parent = team;
}

TeamLevel* Entity::get_parent() const
{
    return parent;
}

bool Entity::is_member() const
{
    return (type == Entity::MEMBER);
}

bool Entity::is_team() const
{
    return (type == Entity::TEAM);
}

bool Entity::is_partition() const
{
    return (type == Entity::PARTITION);
}

// Output operator
ostream& operator<<(ostream& os, const Entity& entity)
{
    entity.output(os);
    return os;
}

///////////////////////////////////////////////////////////////////////////////
// EntityList

EntityList::EntityList()
{
}

EntityList::EntityList(Entity* child)
{
    append(child);
}

// Pseudo copy constructor - entities are made children of the given parent
EntityList::EntityList(const EntityList& list, TeamLevel* parent)
{
    assert(parent);
    members.reserve(list.size());
    EntityListIterator itr(list);
    while(!itr.done()) {
	Entity* copy = itr->clone();
	append(copy);
	copy->set_parent(parent);
	++itr;
    }
}

// Destructor
EntityList::~EntityList()
{
    // Delete each of the entities that are part of this list.
    // Because some entities are in multiple lists, we really should change this destructor to be
    // more careful
    EntityListIterator itr(*this);
    while(!itr.done()) {
	delete (Entity*)itr;
	++itr;
    }
}

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

Entity* EntityList::operator[](size_t i) const
{
    return members[i];
}

TeamLevel* EntityList::get_subteam(size_t i) const
{
    Entity* element = members[i];
    assert(element->get_type() == Entity::TEAM);
    return (TeamLevel*)element;
}

Entity* EntityList::get_member(size_t i) const
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

EntityListIterator EntityList::list_iterator() const
{
    return EntityListIterator(*this);
}

int EntityList::find_index_of(Entity* member)
{
    EntityListIterator itr(*this);
    int count = 0;
    while(!itr.done()) {
	if(member == (Entity*)itr) {
	    return count;
	}
	++count;
	++itr;
    }
    return -1;	// Not found
}

Entity* EntityList::first_member() const
{
    assert(members.size() > 0);
    return members[0];
}

ostream& operator<<(ostream& os, const EntityList& list)
{
    os << " {" << endl;
    EntityListIterator itr(list);
    while(!itr.done()) {
	os << "   " << *itr;
	++itr;
    }
    return os;
}

///////////////////////////////////////////////////////////////////////////////
// EntityListIterator

// Constructor
EntityListIterator::EntityListIterator(const EntityList& list) :
	list(list),
	entityNum(0)
{
}

Entity& EntityListIterator::operator*() const
{
    return *(list.members[entityNum]);
}

Entity* EntityListIterator::operator->() const
{
    return list.members[entityNum];
}

EntityListIterator::operator Entity*() const
{
    return list.members[entityNum];
}

EntityListIterator::operator Member*() const
{
    return (Member*)(list.members[entityNum]);
}

EntityListIterator::operator TeamLevel*() const
{
    return (TeamLevel*)(list.members[entityNum]);
}

EntityListIterator::operator Partition*() const
{
    return (Partition*)(list.members[entityNum]);
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

bool EntityListIterator::done() const
{
    return entityNum >= list.size();
}

void EntityListIterator::reset()
{
    entityNum = 0;
}

///////////////////////////////////////////////////////////////////////////////
// MemberIterator
void MemberIterator::find_next(bool advance)
{
    if(listStack.size() == 0) {
	return;		// End of the road - we've traversed everything
    }
    EntityListIterator& top = listStack.top();
    if(top.done()) {
	// We're done at this level - go up one and keep trying
	listStack.pop();
	find_next(true);
    } else if(advance) {
	++top;
	find_next(false);
    } else if(top->is_member()) {
	// We've found a member - stop here
    } else {
	assert(top->is_team());
	// We're at a team level - go lower
	listStack.emplace(((TeamLevel*)top)->get_children());
	// Find next member if we're not at one
	find_next(false);
    }
}

// Constructor
MemberIterator::MemberIterator(const TeamLevel* team)
{
    // Work our way down to the lowest level
    listStack.emplace(team->get_children());
    find_next(false);
}

Member& MemberIterator::operator*() const
{
    const EntityListIterator& top = listStack.top();
    return *(Member*)top;
}

Member* MemberIterator::operator->() const
{
    const EntityListIterator& top = listStack.top();
    return (Member*)top;
}

MemberIterator::operator Member*() const
{
    const EntityListIterator& top = listStack.top();
    return (Member*)top;
}

MemberIterator& MemberIterator::operator++()	// prefix
{
    // Get top of stack - if it points to something
    assert(!listStack.top().done());
    find_next(true);
    return *this;
}

MemberIterator MemberIterator::operator++(int)	// postfix
{
    MemberIterator tmp(*this);
    ++(*this);
    return tmp;
}

bool MemberIterator::done() const
{
    if(listStack.size() == 0) {
	return true;
    } else {
	const EntityListIterator& top = listStack.top();
	return top.done();
    }
}

///////////////////////////////////////////////////////////////////////////////
// Member

// Constructors
Member::Member(const Member& member) :
	Entity(Entity::MEMBER, member.person.get_id(), member.partition),
	person(member.person),
	conditionMet(member.conditionMet)
{
}

Member::Member(const Person& person, Partition* partition) :
	Entity(Entity::MEMBER, person.get_id(), partition),
	person(person)
{
}

const string& Member::get_attribute_value(Attribute* attr) 
{
    return person.get_string_attribute_value(attr);
}

const Person& Member::get_person()
{
    return person;
}

void Member::output(ostream& os) const
{
    os << "Member " << (long)this << " id: " << name <<
	    " memberof: " << (long)parent <<
	    " partition: " << (long)partition <<
	    " conditionMet: ";
    for(int i=0; i < conditionMet.size(); i++) {
	if(conditionMet[i]) {
	    os << "1";
	} else {
	    os << "0";
	}
    }
    os << endl;
}

void Member::append_condition_value(bool met)
{
    conditionMet.push_back(met);
}

bool Member::is_condition_met(int constraintNumber) const
{
    return conditionMet[constraintNumber];
}

Member* Member::clone()
{
    Member* copy = new Member(*this);
    partition->update_lowest_cost_member_map(&(copy->get_person()), copy);
    return copy;
}

///////////////////////////////////////////////////////////////////////////////
// TeamLevel

// Constructors
// Copy constructor
TeamLevel::TeamLevel(const TeamLevel& team) :
	Entity(Entity::TEAM, team.name, team.partition),
	children(team.children, this),
	level(team.level)
{
}

TeamLevel::TeamLevel(const Level& level, Partition* partition) :
	Entity(Entity::TEAM, partition),
	level(level)
{
}

TeamLevel::TeamLevel(const Level& level, const string& teamName, Partition* partition) :
	Entity(Entity::TEAM, teamName, partition),
	level(level) 
{
}

void TeamLevel::add_child(Entity* child) 
{
    children.append(child);
    child->set_parent(this);
}

const Level& TeamLevel::get_level() const
{
    return level;
}

const EntityList& TeamLevel::get_children() const
{
    return children;
}

Entity* TeamLevel::get_first_child() const
{
    return children.first_member();
}

int TeamLevel::num_children() const
{
    return children.size();
}

int TeamLevel::size() const
{
    return children.size();
}

int TeamLevel::find_index_of(Entity* child)
{
    int index = children.find_index_of(child);
    assert(index != -1);	// Must be found
    return index;
}

void TeamLevel::output(ostream& os) const
{
    os << "TeamLevel " << (long)this << " memberof : " << (long)parent <<
	    " partition: " << (long)partition <<
	    " level: " << level.get_level_num() <<
	    endl << "Members:" << children << endl;
}

EntityListIterator TeamLevel::child_iterator() const
{
    return EntityListIterator(children);
}

MemberIterator TeamLevel::member_iterator() const
{
    return MemberIterator(this);
}

TeamLevel* TeamLevel::clone()
{
    return new TeamLevel(*this);
}

///////////////////////////////////////////////////////////////////////////////
// Partition

// Constructor
Partition::Partition(AllTeamData* allTeamData, const Level& level, const string& name, int numPeople) :
	TeamLevel(level, name, this),
	allTeamData(allTeamData),
	cost(0.0),
	lowestCost(0.0),
	lowestCostTopLevelTeams(nullptr)
{
    type = Entity::PARTITION;	// override default TEAM
    allMembers.reserve(numPeople);
    teamsAtEachLevel[0] = nullptr;
    for(int i = 1; i <= allTeamData->num_levels(); i++) {
	teamsAtEachLevel[i] = new EntityList();
    }
}

// Other member functions
Member* Partition::add_person(const Person* person)
{
    Member* member = new Member(*person, this);
    allMembers.append(member);
    return member;
}

void Partition::populate_random_teams()
{
    const vector<Level*>& allLevels = allTeamData->all_levels();

    assert(children.size() == 0);

    // Work out our lowest level - use a reverse iterator.
    vector<Level* const>::reverse_iterator levelItr = allLevels.rbegin(); 
    // Iterate over all the levels (from the bottom up) and create our teams at each level
    EntityList* membersToPutInTeams = &allMembers;
    do {
	int levelNum = (*levelItr)->get_level_num();
	// Work out how many teams we need
	int numTeams = AllTeamData::number_of_teams(membersToPutInTeams->size(), 
		(*levelItr)->get_min_size(), (*levelItr)->get_ideal_size(), 
		(*levelItr)->get_max_size());
	// Reserve space for these teams
	teamsAtEachLevel[levelNum]->reserve(numTeams);
	// Create all the necessary empty teams - assume the partition is the parent
	// for now
	for(int i = 0; i < numTeams; i++) {
	    TeamLevel* team = new TeamLevel(**levelItr, this);
	    teamsAtEachLevel[levelNum]->append(team);
	    team->set_parent(this);
	}
	// Iterate over all the teams/members at the level below and put them in teams
	// at this level
	for(int i = 0; i < membersToPutInTeams->size(); i++) {
	    teamsAtEachLevel[levelNum]->get_subteam(i % numTeams)->add_child((*membersToPutInTeams)[i]);
	}

	// Move up to the next level
	membersToPutInTeams = teamsAtEachLevel[levelNum];
	++levelItr;
    } while(!(*levelItr)->is_partition());

    // Set the children of this partition as the teams at level 1
    children = *(teamsAtEachLevel[1]);
}

void Partition::populate_existing_teams()
{
    // Work from the top level down
    // Iterate over all the members in the partition
    for(int i = 0; i < allMembers.size(); ++i) {
	// Iterate over all the attributes of the member which are the names of the levels
	// We iterate from the top level down
	TeamLevel* teamAtLevel = this;	// partition
	bool unallocated = false;
	for(int levelNum = 1; levelNum <= allTeamData->num_levels(); levelNum++) {
	    TeamLevel* parent = teamAtLevel;
	    // Get the attribute for this level (there should be one in our team file - it
	    // is an error if not)
	    Attribute* levelAttribute = allTeamData->get_level(levelNum).get_field_attribute();
	    
	    if(!levelAttribute) {
		throw AnnealException("Could not find attribute in csv file: ",
			allTeamData->get_level(levelNum).get_field_name().c_str());
	    }

	    // Get the value of this attribute for this person - it's possible the value is blank
	    const string& teamLevelName = ((Member*)allMembers[i])->get_attribute_value(levelAttribute);

	    // If the value is blank (at any level), this person is unallocated - abort - do not
	    // create any more teams at any level for this person
	    if(teamLevelName == "") {
		unallocated = true;
		break;
	    }

	    teamAtLevel = (TeamLevel*)teamsAtEachLevel[levelNum]->find_entity_with_name(teamLevelName);
	    if(!teamAtLevel) {
		// Team doesn't exist - create it
		teamAtLevel = new TeamLevel(allTeamData->get_level(levelNum), teamLevelName, this);
		// Add team to the list of teams at this level
		teamsAtEachLevel[levelNum]->append(teamAtLevel);
		// Insert team into the hierarchy
		parent->add_child(teamAtLevel);
	    } else {
		assert(teamAtLevel->is_team());
	    }
	}
	if(unallocated) {
	    // Person wasn't allocated to a team (one of the team names at some level was blank).
	    unallocatedMembers.append(allMembers[i]);
	} else {
	    // We've made our way to the bottom level - add the person as a member
	    teamAtLevel->add_child(allMembers[i]);
	}
    }
}

void Partition::set_current_teams_as_lowest_cost()
{
    lowestCost = cost;
    if(lowestCostTopLevelTeams) {
	// Delete the whole hierarchy of cloned teams and members
	delete lowestCostTopLevelTeams;
    }
    lowestCostTopLevelTeams = new EntityList(children, this);
}

void Partition::update_lowest_cost_member_map(const Person* person, Member* member)
{
    lowestCostMemberMap.insert(pair<const Person*,Member*>(person, member));
}

Member* Partition::get_lowest_cost_member_for_person(const Person* person)
{
    map<const Person*,Member*>::iterator it = lowestCostMemberMap.find(person);
    assert(it != lowestCostMemberMap.end()); // person must be found
    return it->second;
}

int Partition::find_index_of(Entity* member)
{
    int index = children.find_index_of(member);
    if(index == -1 && lowestCostTopLevelTeams) {
	// Check in the lowest cost teams
	index = lowestCostTopLevelTeams->find_index_of(member);
    }
    assert(index != -1);	// Must be found in one of the lists
    return index;
}

void Partition::output(ostream& os) const
{
    os << "Partition " << (long)this << " memberof : " << (long)parent <<
	    " partition: " << (long)partition <<
	    " level: " << level.get_level_num() <<
	    endl << "Partition Members:" << endl << children <<
	    "allMembers:" << endl << allMembers;
    for(int i = 1; i <= allTeamData->num_levels(); ++i) {
	os << "Teams at level " << i << endl << *teamsAtEachLevel[i] << endl;
    }
    os << "lowestCostTopLevelTeams:" << endl;
    if(lowestCostTopLevelTeams) {
	os << *(lowestCostTopLevelTeams);
    }
    os << "Lowest Cost Member Map" << endl;
    map<const Person*,Member*>::const_iterator itr = lowestCostMemberMap.begin();
    while(itr != lowestCostMemberMap.end()) {
	os << "   " << itr->first->get_id() << " associated with member " << (long)itr->second << endl;
	++itr;
    }
    os << "----" << endl << "Lowest Level Members" << endl;
    MemberIterator memberItr(this);
    while(!memberItr.done()) {
	os << memberItr->get_name() << " ";
	++memberItr;
    }
    os << "End Partition" << endl;
}

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
