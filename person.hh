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
    Person(string& s);

    // Operators
    friend ostream& operator<<(ostream& os, const Person& p);

    void add_attribute_value_pair(const string& attrName, const string& strValue);
    void add_attribute_value_pair(const string& attrName, const string& strValue, 
            const double numValue);
};

#endif
