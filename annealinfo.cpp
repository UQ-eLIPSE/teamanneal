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
void AnnealInfo::add_person(Person* person)
{
    allPeople.push_back(person);
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
void AnnealInfo::add_level(Level* level)
{
    allLevels.push_back(level);
}

int AnnealInfo::num_levels()
{
    return allLevels.size();
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

Level* AnnealInfo::get_level(int n)
{
    assert(n >= 1 && n <= allLevels.size());
    return allLevels[n-1];
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
