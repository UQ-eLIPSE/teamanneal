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
    map<Attribute,string> stringAttributes;
    map<Attribute,double> numberAttributes;

    // Constructor
    Person(const string& id);

    // Add attribute value pair to this person. The first function is for string attributes,
    // the second is for numerical attributes. (We record all attributes as strings, but 
    // only some as numbers.)
    void add_attribute_value_pair(Attribute* attr, const string& strValue);
    void add_attribute_value_pair(Attribute* attr, double numValue);

    const string& get_string_attribute_value(const Attribute* attr);
    const string& get_id();

    bool has_attribute_value_pair(Attribute* attr, const string& strValue);

    // Operators
    friend ostream& operator<<(ostream& os, const Person& p);
};

#endif
