#include "person.hh"
#include <assert.h>

using namespace std;

Person::Person(const string& id) :
	id(id) 
{
}

void Person::add_attribute_value_pair(const Attribute* attr, const string& strValue) 
{
    // Add the value to the set of string attributes for this person
    stringAttributes.insert( pair<const Attribute*,string>(attr, strValue) );
}

void Person::add_attribute_value_pair(const Attribute* attr, double numValue) 
{
    // Add the value to the set of string attributes for this person
    numberAttributes.insert( pair<const Attribute*,double>(attr, numValue) );
}

const string& Person::get_string_attribute_value(const Attribute* attr) const
{
    map<const Attribute*,string>::const_iterator it = stringAttributes.find(attr);
    assert(it != stringAttributes.end()); 	// We must have found it
    return it->second;
}

double Person::get_numeric_attribute_value(const Attribute* attr) const
{
    map<const Attribute*,double>::const_iterator it = numberAttributes.find(attr);
    assert(it != numberAttributes.end()); 	// We must have found it
    return it->second;
}

const string& Person::get_id() const
{
    return id;
}

bool Person::has_attribute(const Attribute* attr) const
{
    assert(attr);
    map<const Attribute*,string>::const_iterator it = stringAttributes.find(attr);
    return (it != stringAttributes.end());
}

bool Person::has_attribute_value_pair(const Attribute* attr, const string& strValue) const
{
    assert(attr);
    map<const Attribute*,string>::const_iterator it = stringAttributes.find(attr);
    if(it != stringAttributes.end()) {
	// Found the attribute - check if the value is a match
	return (strValue == it->second);
    } else {
	// Attribute not found - can't match
	return false;
    }
}

ostream& operator<<(ostream& os, const Person& p) 
{
    os << p.id;
    os << endl << "String attributes " << p.stringAttributes.size() << ":" << endl;
    for(map<const Attribute*,string>::const_iterator i = p.stringAttributes.begin(); 
            i != p.stringAttributes.end(); i++) {
        os << "  " << (*(i->first)).name << " : " << i->second << endl;
    }
    os << "Numerical attributes " << p.numberAttributes.size() << ":" << endl;
    for(map<const Attribute*,double>::const_iterator i = p.numberAttributes.begin(); 
            i != p.numberAttributes.end(); i++) {
        os << "  " << (*(i->first)).name << " : " << i-> second << endl;
    }
    return os;
}

