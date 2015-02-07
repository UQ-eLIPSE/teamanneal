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
