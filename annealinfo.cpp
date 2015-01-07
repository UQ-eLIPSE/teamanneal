//
// annealinfo.cpp
//

#include "annealinfo.hh"
#include <assert.h>

// Constructor
AnnealInfo::AnnealInfo() :
    partitionField(nullptr),
    idField(nullptr)
{
}

// Other member functions

void AnnealInfo::add_constraint(Constraint* constraint) 
{
    allConstraints.push_back(constraint);
}

void AnnealInfo::add_level(Level* level)
{
    allLevels.push_back(level);
}

void AnnealInfo::set_partition_field(const string& fieldName)
{
    partitionFieldName = fieldName;
}

void AnnealInfo::set_id_field(const string& fieldName)
{
    idFieldName = fieldName;
}

void AnnealInfo::set_name_format(const string& format)
{
    nameFormat = format;
}

int AnnealInfo::num_constraints()
{
    return allConstraints.size();
}

int AnnealInfo::num_levels()
{
    return allLevels.size();
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

Attribute* AnnealInfo::get_partition_field()
{
    return partitionField;
}

Attribute* AnnealInfo::get_id_field()
{
    return idField;
}

const string& AnnealInfo::get_name_format()
{
    return nameFormat;
}
