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
    typedef set<const string>::iterator ValueIterator;

    string name;
    Attribute::Type type;
    set<const string> values;	// Set of all possible values for this attribute (as strings)

    // Constructor
    Attribute(const string& name, Attribute::Type type);

    // Operators
    bool operator <(const Attribute& rhs) const;
    friend ostream& operator<<(ostream& os, const Attribute& a);

    // Other Member Functions
    void add_value(const string& value);
    const string& get_name();
    bool is_string();
    bool is_numeric();
    size_t num_values();
    void rename(const string& str);	// change the name of this attribute

    // Return an iterator to the beginning of the set of values
    ValueIterator iterator();
    // Return an iterator to the end of the set of values
    ValueIterator end();
};

#endif 

