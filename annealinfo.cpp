//
// annealinfo.cpp
//

#include "annealinfo.hh"
#include <assert.h>
#include <sstream>

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

int AnnealInfo::num_attributes()
{
    return allAttributes.size();
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
const vector<Level*>& AnnealInfo::all_levels() const
{
    return allLevels;
}

void AnnealInfo::add_level(Level* level)
{
    allLevels.push_back(level);
}

int AnnealInfo::num_levels() const
{
    // We assume we have a partition level and don't include that in the count
    // This function should not be called until we at least a partition level (0)
    assert(allLevels.size() > 0);
    return allLevels.size() - 1;
}

Level* AnnealInfo::get_level(int n) const
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

// We update attribute names of columns which have the same name as our output (level)
// columns and/or our team name column. We update names by appending an integer to the level name. 
// We increment this integer until the column name is unique
void AnnealInfo::update_column_names_if_required()
{
    // Iterate over each level name and check whether there is an attribute with this name
    for(int levelNum = 1; levelNum <= num_levels(); ++levelNum) {
	Level* level = get_level(levelNum);
	Attribute* attr = level->get_field_attribute();
	if(attr) {
	    // There is an attribute associated with this level name - we need to rename the attribute
	    stringstream str;
	    int appendNumber = 1;
	    do {
		// Generate possible new name
		str.str("");
		str << level->get_field_name() << appendNumber;
		// Check if it is unique
		++appendNumber;
	    } while (find_attribute(str.str()));
	    // str.str() is a unique name - rename the attribute
	    attr->rename(str.str());
	} // else level name is already unique
    }

    // Check the team name column
    Attribute* attr = find_attribute(teamNameField);
    if(attr) {
	// There is an attribute already associated with this team name field - we need to rename the attribute
	stringstream str;
	int appendNumber = 1;
	do {
	    // Generate possible new name
	    str.str("");
	    str << teamNameField << appendNumber;
	    // Check if it is unique
	    ++appendNumber;
	} while (find_attribute(str.str()));
	// str.str() is a unique name - rename the attribute
	attr->rename(str.str());
    } // else team name field name is already unique

}
