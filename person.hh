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
    string id;
public:
    map<Attribute,string> stringAttributes;
    map<Attribute,double> numberAttributes;

    // Constructor
    Person(const char* id);

    // Operators
    friend ostream& operator<<(ostream& os, const Person& p);

    // Add attribute value pair to this person. The first function is for string attributes,
    // the second is for numerical attributes
    void add_attribute_value_pair(Attribute* attr, const string& strValue);
    void add_attribute_value_pair(Attribute* attr, double numValue);
};

#endif
