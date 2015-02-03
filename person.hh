/*
 * person.hh
 */

#ifndef PERSON_HH
#define PERSON_HH

#include "attribute.hh"
#include <string>
#include <map>
#include <iostream>

using namespace std;

class Person {
protected:
    const string id;
public:
    map<Attribute*,string> stringAttributes;	// includes all attributes
    map<Attribute*,double> numberAttributes;

    // Constructor
    Person(const string& id);

    // Add attribute value pair to this person. The first function is for string attributes,
    // the second is for numerical attributes. (We record all attributes as strings, but 
    // only some as numbers.)
    void add_attribute_value_pair(Attribute* attr, const string& strValue);
    void add_attribute_value_pair(Attribute* attr, double numValue);

    // Get the value of the given attribute. The person MUST have this attribute
    const string& get_string_attribute_value(Attribute* attr) const;
    const string& get_id() const;

    // Return true if the person has this (non-null) attribute
    bool has_attribute(Attribute* attr) const;
    // Return true if this person has this attribute AND the attribute has the given value
    bool has_attribute_value_pair(Attribute* attr, const string& strValue) const;

    // Operators
    friend ostream& operator<<(ostream& os, const Person& p);
};

#endif
