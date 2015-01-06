/*
 * attribute.hh
 */

#ifndef ATTRIBUTE_HH
#define ATTRIBUTE_HH

#include <map>
#include <set>
#include <string>
#include <iostream>
using namespace std;


class Attribute {
public:
    enum Type { NUMERICAL, STRING };

    const string name;
    Attribute::Type type;
    set<const string> values;

    // Constructor
    Attribute(const string& name, Attribute::Type type);

    // Operators
    bool operator <(const Attribute& rhs) const;
    friend ostream& operator<<(ostream& os, const Attribute& a);

    // Other Member Functions
    void add_value(const string& value);
};

class AllAttributes {
public:
    map<string, Attribute> all;

    // Operators
    friend ostream& operator<<(ostream& os, const AllAttributes& a);

    void add(const string& attrName, Attribute::Type type);
    Attribute* find(const string& name);
};

extern AllAttributes allAttributes;

#endif 

