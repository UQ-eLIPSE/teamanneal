//
// entity.cpp
//

#include "teamData.hh"
#include "entity.hh"
#include "person.hh"
#include "attribute.hh"
#include <exception>
#include "assert.h"
#include "exceptions.hh"
#include <ctime>

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
    return (name.compare(value) == 0);
}

const string& Entity::get_name() const
{
    return name;
}

const string& Entity::set_name(const string& value) 
{
    // FIX THIS?
    //if(name.compare("") == 0) {
	name = value;
    //}
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

bool Entity::has_parent() const
{
    return (parent != nullptr);
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
// Member

// Constructors
Member::Member(const Member& member) :
	Entity(Entity::MEMBER, member.person.get_id(), member.partition),
	person(member.person),
	conditionMet(member.conditionMet)
{
    assert(false);	// We never copy members
}

Member::Member(const Person& person, Partition* partition) :
	Entity(Entity::MEMBER, person.get_id(), partition),
	person(person)
{
}

const string& Member::get_attribute_value(const Attribute* attr) const
{
    return person.get_string_attribute_value(attr);
}

double Member::get_numeric_attribute_value(const Attribute* attr) const
{
    return person.get_numeric_attribute_value(attr);
}

int Member::get_attribute_value_index(const Attribute* attr) const
{
    return person.get_string_attribute_index(attr);
}

const Person& Member::get_person() const
{
    return person;
}

const string& Member::get_id() const
{
    return person.get_id();
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

///////////////////////////////////////////////////////////////////////////////
// TeamLevel

// Constructors
// Pseudo-copy constructor
TeamLevel::TeamLevel(const TeamLevel* team, bool setMemberParents) :
	Entity(Entity::TEAM, team->name, team->partition),
	children(team->children, this, setMemberParents),
	level(team->level),
	fullTeamName(team->fullTeamName)
{
}

TeamLevel::TeamLevel(const Level& level, Partition* partition) :
	Entity(Entity::TEAM, partition),
	level(level)
{
}

TeamLevel::TeamLevel(const Level& level, const string& teamName, Partition* partition) :
	Entity(Entity::TEAM, teamName, partition),
	level(level),
	fullTeamName(teamName)
{
}

void TeamLevel::add_child(Entity* child) 
{
    children.append(child);
    child->set_parent(this);
}

void TeamLevel::remove_child(Entity* child)
{
    children.remove(child);
    child->set_parent(nullptr);
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

void TeamLevel::set_full_team_name(const string& fullName)
{
    fullTeamName = fullName;
}

const string& TeamLevel::get_full_team_name() const
{
    return fullTeamName;
}

///////////////////////////////////////////////////////////////////////////////
// Partition

// Constructor
Partition::Partition(AllTeamData* allTeamData, const Level& level, const string& name, int numPeople) :
	TeamLevel(level, name, this),
	allTeamData(allTeamData),
	lowestCostTopLevelTeams(nullptr),
#ifdef CONSTANT_RANDOM_SEED
	randomNumberGenerator(0),
#else
	randomNumberGenerator(time(nullptr)),		// Seed RN generator with current time
#endif
	memberRandomDistribution(0,numPeople-1),	// Random number distribution 0 to numPeople - 1
	teamRandomDistribution(0,0),			// We'll reset the bounds of this later when we
							// know how many teams there are
	memberdice(bind(memberRandomDistribution,randomNumberGenerator)),
	teamdice(bind(teamRandomDistribution,randomNumberGenerator))
{
    type = Entity::PARTITION;	// override default TEAM
    allMembers.reserve(numPeople);
    teamsAtEachLevel[0] = nullptr;	// we don't use this entry
    for(int i = 1; i <= allTeamData->num_levels(); i++) {
	teamsAtEachLevel[i] = new EntityList();
    }
    teamsAtLowestLevel = teamsAtEachLevel[allTeamData->num_levels()];
}

// Other member functions

Attribute* Partition::get_partition_attribute() const
{
    return level.get_field_attribute();
}

Member* Partition::add_person(const Person* person)
{
    Member* member = new Member(*person, this);
    allMembers.append(member);
    personToMemberMap.insert(pair<const Person*,Member*>(person, member));
    return member;
}

Member* Partition::get_member_for_person(const Person* person)
{
    map<const Person*, Member*>::iterator it = personToMemberMap.find(person);
    assert(it != personToMemberMap.end());		// person must be found
    return it->second;
}

int Partition::num_members() const
{
    return allMembers.size();
}

void Partition::clear()
{
    // Remove teams at the top level - this does not destroy the members, we keep pointers
    // to them in the teamsAtEachLevel element
    children.clear();

    // Delete the teams - this will recursively destroy all sub teams (but not the underlying members)
    delete teamsAtEachLevel[1];

    // Recreate the empty list at level one
    teamsAtEachLevel[1] = new EntityList();

    // For lower level teams - clear the lists (this removes elements within but does not try to 
    // destroy them since we will have just destroyed them (teams anyway).
    for(int i = 2; i <= allTeamData->num_levels(); i++) {
	teamsAtEachLevel[i]->clear();
    }
    teamsAtLowestLevel = teamsAtEachLevel[allTeamData->num_levels()];
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

    // Set the children of this partition as the teams at level 1 - we copy the list (shallow copy)
    children = *(teamsAtEachLevel[1]);
    reset_random_team_distribution();
}

void Partition::populate_existing_teams()
{
    const string& nameFieldName = allTeamData->get_anneal_info().get_team_name_field();
    Attribute* nameFieldAttribute = allTeamData->get_anneal_info().find_attribute(nameFieldName);
    if(!nameFieldAttribute) {
	throw AnnealException("Could not find overall name field in csv file: ", nameFieldName.c_str());
    }
    int lowestLevelNum = allTeamData->num_levels();

    assert(children.size() == 0);
    // Work from the top level down
    // Iterate over all the members in the partition
    for(int i = 0; i < allMembers.size(); ++i) {
	Member* member = (Member*)allMembers[i];
	// Iterate over all the attributes of the member which are the names of the levels
	// We iterate from the top level down
	TeamLevel* teamAtLevel = this;	// partition
	bool unallocated = false;
	const string& fullTeamName = member->get_attribute_value(nameFieldAttribute);
	if(fullTeamName.compare("") == 0) {
	    unallocated = true;
	}
	for(int levelNum = 1; levelNum <= lowestLevelNum; levelNum++) {
	    TeamLevel* parent = teamAtLevel;
	    // Get the attribute for this level (there should be one in our team file - it
	    // is an error if not)
	    Attribute* levelAttribute = allTeamData->get_level(levelNum).get_field_attribute();
	    
	    if(!levelAttribute) {
		throw AnnealException("Could not find attribute in csv file: ",
			allTeamData->get_level(levelNum).get_field_name().c_str());
	    }

	    // Get the value of this attribute for this person - it's possible the value is blank
	    const string& teamLevelName = member->get_attribute_value(levelAttribute);

	    // If the value is blank (at any level), this person is unallocated - abort - do not
	    // create any more teams at any level for this person
	    if(teamLevelName.compare("") == 0) {
		unallocated = true;
		break;
	    }

	    teamAtLevel = (TeamLevel*)teamsAtEachLevel[levelNum]->find_entity_with_name(teamLevelName);
	    if(!teamAtLevel) {
		// Team doesn't exist - create it
		teamAtLevel = new TeamLevel(allTeamData->get_level(levelNum), teamLevelName, this);
		if(levelNum == lowestLevelNum) {
		    // lowest level team - set full team name
		    teamAtLevel->set_full_team_name(fullTeamName);
		}
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
    reset_random_team_distribution();
}

void Partition::restore_lowest_cost_teams()
{
    this->clear();

    // Copy the list. This is a recursive semi-deep copy - teams are copied, but members are not copied.
    // The "true" argument at the end ensures that the parents of any members are updated to their 
    // new (copied) teams
    EntityList* newTeams = new EntityList(*lowestCostTopLevelTeams, this, true);
    // Shallow copy to the children of this partition
    children = *newTeams;

    // Update the list of teams at each level
    *(teamsAtEachLevel[1]) = children;
    int level = 1;
    while(level < allTeamData->num_levels()) {
	// Iterate over all the teams at the current level add lower level teams to their list
	EntityListIterator itr(*(teamsAtEachLevel[level]));
	while(!itr.done()) {
	    EntityListIterator childItr = ((TeamLevel*)itr)->child_iterator();
	    while(!childItr.done()) {
		teamsAtEachLevel[level+1]->append((Entity*)childItr);
		++childItr;
	    }
	    ++itr;
	}
	++level;
    }

    reset_random_team_distribution();
}

void Partition::set_current_teams_as_lowest_cost()
{
    if(lowestCostTopLevelTeams) {
	// Delete the whole hierarchy of cloned teams and members
	delete lowestCostTopLevelTeams;
    }
    // "false" as the last argument here means that we do not update the "parent" links
    // in each member - we just copy the team structure
    lowestCostTopLevelTeams = new EntityList(children, this, false);
}

Member* Partition::get_random_member()
{
    return (Member*)allMembers[memberdice()];
}

TeamLevel* Partition::get_random_team()
{
    return teamsAtLowestLevel->get_subteam(teamdice());
}

void Partition::reset_random_team_distribution()
{
    teamRandomDistribution.param(uniform_int_distribution<int>::param_type(0, teamsAtLowestLevel->size()-1));
}

void Partition::remove_member_from_lowest_level_team(Member* member)
{
    TeamLevel* team = member->get_parent();
    assert(team);
    team->remove_child(member);
}

void Partition::add_member_to_lowest_level_team(Member* member, TeamLevel* team)
{
    team->add_child(member);
}

int Partition::find_index_of(Entity* member)
{
    int index = children.find_index_of(member);
#if 0
    if(index == -1 && lowestCostTopLevelTeams) {
	// Check in the lowest cost teams
	index = lowestCostTopLevelTeams->find_index_of(member);
    }
#endif
    assert(index != -1);	// Must be found in one of the lists
    return index;
}

EntityListIterator Partition::teams_at_level_iterator(int levelNum) const
{
    assert(levelNum >= 1 && levelNum <= allTeamData->num_levels());
    return EntityListIterator(*(teamsAtEachLevel[levelNum]));
}

EntityListIterator Partition::teams_at_lowest_level_iterator() const
{
    return EntityListIterator(*teamsAtLowestLevel);
}

int Partition::num_teams_at_lowest_level() const
{
    return teamsAtLowestLevel->size();
}

AllTeamData* Partition::get_all_team_data() const
{
    return allTeamData;
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
    os << "Person to Member Map" << endl;
    map<const Person*,Member*>::const_iterator itr = personToMemberMap.begin();
    while(itr != personToMemberMap.end()) {
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
