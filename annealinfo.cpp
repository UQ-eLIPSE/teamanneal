//
// annealinfo.cpp
//

#include "annealinfo.hh"
#include <assert.h>

// Constructor
AnnealInfo::AnnealInfo() :
    idField(nullptr),
    partitionField(nullptr)
{
}

// Other member functions

///////////////////////////////////////////////////////////////////////////////
// Attribute related member functions
void AnnealInfo::add_attribute(Attribute* attr)
{
    allAttributes.push_back(attr);
    attributeMap.insert(pair<string,Attribute*>(attr->get_name(), attr));
}

Attribute* AnnealInfo::get_attribute(unsigned int i)
{
    assert(i < allAttributes.size());
    return allAttributes[i];
}

Attribute* AnnealInfo::find_attribute(const string& name)
{
    map<string,Attribute*>::iterator it = attributeMap.find(name);
    if(it != attributeMap.end()) {
	// Found the attribute name - return the value
	return it->second;
    } else {
	return nullptr;
    }
}

void AnnealInfo::set_id_attribute(Attribute* idAttr)
{
    // idField can't have already been set
    assert(!idField);

    idField = idAttr;
}

///////////////////////////////////////////////////////////////////////////////
// Person related member functions
vector<Person*>& AnnealInfo::all_people()
{
    return allPeople;
}

void AnnealInfo::add_person(Person* person)
{
    allPeople.push_back(person);
}

int AnnealInfo::num_people()
{
    return allPeople.size();
}

int AnnealInfo::count_people_with_attribute_value(Attribute* attr, const string& value)
{
    int count = 0;
    for(vector<Person*>::iterator it = allPeople.begin(); it != allPeople.end(); ++it) {
	if((*it)->has_attribute_value_pair(attr, value)) {
	    count++;
	}
    }
    return count;
}

///////////////////////////////////////////////////////////////////////////////
// Partition related member functions
void AnnealInfo::set_partition_field(const string& fieldName)
{
    partitionField = find_attribute(fieldName);
}

Attribute* AnnealInfo::get_partition_field()
{
    return partitionField;
}

///////////////////////////////////////////////////////////////////////////////
// Level related member functions
vector<Level*>& AnnealInfo::all_levels()
{
    return allLevels;
}

void AnnealInfo::add_level(Level* level)
{
    allLevels.push_back(level);
}

int AnnealInfo::num_levels()
{
    // We assume we have a partition level and don't include that in the count
    // This function should not be called until we at least a partition level (0)
    assert(allLevels.size() > 0);
    return allLevels.size() - 1;
}

Level* AnnealInfo::get_level(int n)
{
    assert(n >= 0 && n < allLevels.size());
    return allLevels[n];
}

///////////////////////////////////////////////////////////////////////////////
// Constraint related member functions
void AnnealInfo::add_constraint(Constraint* constraint) 
{
    allConstraints.push_back(constraint);
}

///////////////////////////////////////////////////////////////////////////////
// Team name related member functions
void AnnealInfo::set_team_name_format(const string& format)
{
    teamNameFormat = format;
}

void AnnealInfo::set_team_name_field(const string& fieldName)
{
    teamNameField = fieldName;
}

int AnnealInfo::num_constraints()
{
    return allConstraints.size();
}

Constraint* AnnealInfo::get_constraint(int n) 
{
    assert(n >= 0 && n < allConstraints.size());
    return allConstraints[n];
}

/*
Attribute* AnnealInfo::get_partition_field()
{
    return partitionField;
}

Attribute* AnnealInfo::get_id_field()
{
    return idField;
}
*/

const string& AnnealInfo::get_team_name_format()
{
    return teamNameFormat;
}

const string& AnnealInfo::get_team_name_field()
{
    return teamNameField;
}
