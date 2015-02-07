#include "attribute.hh"
#include <iostream>
#include <string>
#include <map>
#include <assert.h>
#include <cmath>
using namespace std;

Attribute::Attribute(const string& name, Attribute::Type type) : 
        name(name), 
	type(type),
	numericRange(pair<double,double>(INFINITY,-INFINITY))
{
}

#if 0
bool Attribute::operator <(const Attribute& rhs) const 
{
    return (name < rhs.name);
}
#endif

ostream& operator<<(ostream& os, const Attribute& a) 
{
    os << a.name << ",";
    if(a.type == Attribute::NUMERICAL) { 
        os << "NUM," << a.stringValues.size();
        // Convert the strings to numbers so we can print the strings in numerical sorted order
        // We treat any blanks as -infinity so the blank gets printed first.
        map<double,string> numValues;
        for(Attribute::ValueIterator i = a.iterator(); i != a.end(); i++) {
            if(*i == "") {
                numValues.insert( pair<double,string>(-INFINITY,"") );
            } else {
                numValues.insert( pair<double,string>(stod(*i),*i) );
            }
        }
        // Make sure we have as many distinct strings as we do distinct numbers. This may
        // be a problem with very large precision numbers that are not distinct when stored
        // as doubles.
        assert(a.stringValues.size() == numValues.size());
        for(map<double,string>::const_iterator i = numValues.begin(); i != numValues.end(); i++) {
            os << "," << i->second;
        }
    } else {
        os << "STR," << a.stringValues.size();
        for(Attribute::ValueIterator i = a.iterator(); i != a.end(); i++) {
            os << "," << *i;
        }
    }
    return os;
}

int Attribute::add_value(const string& value) 
{
    // Check for uniqueness
    map<string,int>::iterator it = valueToIndexMap.find(value);
    if(it == valueToIndexMap.end()) {
	// Don't have that value - add it to our vector, get the index and add
	// an entry to our map
	stringValues.push_back(value);
	int posn = stringValues.size() - 1;
	valueToIndexMap.insert(pair<string,int>(value, posn));
	return posn;
    } else {
	// Value is already in our array - return the pos'n in the list
	return it->second;
    }
}

void Attribute::update_numeric_range_to_include(double d)
{
    assert(type == Attribute::NUMERICAL);
    if(d < numericRange.first) {
	numericRange.first = d;
    }
    if(d > numericRange.second) {
	numericRange.second = d;
    }
}

const string& Attribute::get_name() const
{
    return name;
}

const string& Attribute::get_string_value(int index) const
{
    assert(index >=0 && index < stringValues.size());
    return stringValues[index];
}

bool Attribute::is_string() const
{
    return type == Attribute::STRING;
}

bool Attribute::is_numeric() const
{
    return type == Attribute::NUMERICAL;
}

size_t Attribute::num_values() const
{
    return stringValues.size();
}

// We can rename an attribute if it has the same name as one of our output fields
void Attribute::rename(const string& str) 
{
    name = str;
}

double Attribute::get_numerical_min_value() const
{
    return numericRange.first;
}

double Attribute::get_numerical_max_value() const
{
    return numericRange.second;
}

Attribute::ValueIterator Attribute::iterator() const
{
    return stringValues.begin();
}

Attribute::ValueIterator Attribute::end() const
{
    return stringValues.end();
}
