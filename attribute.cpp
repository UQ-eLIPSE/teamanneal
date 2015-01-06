#include "attribute.hh"
#include <iostream>
#include <string>
#include <assert.h>
#include <cmath>
using namespace std;

// Global variable - all the known attributes
AllAttributes allAttributes;

Attribute::Attribute(const string& name, Attribute::Type type) : 
        name(name), type(type) {}

bool Attribute::operator <(const Attribute& rhs) const {
    return (name < rhs.name);
}

ostream& operator<<(ostream& os, const Attribute& a) {
    os << a.name << ",";
    if(a.type == Attribute::NUMERICAL) { 
        os << "NUM," << a.values.size();
        // Convert the strings to numbers so we can print the strings in numerical sorted order
        // We treat any blanks as -infinity so the blank gets printed first.
        map<double,string> numValues;
        for(set<const string>::const_iterator i = a.values.begin(); i != a.values.end(); i++) {
            if(*i == "") {
                numValues.insert( pair<double,string>(-INFINITY,"") );
            } else {
                numValues.insert( pair<double,string>(stod(*i),*i) );
            }
        }
        // Make sure we have as many distinct strings as we do distinct numbers. This may
        // be a problem with very large precision numbers that are not distinct when stored
        // as doubles.
        assert(a.values.size() == numValues.size());
        for(map<double,string>::const_iterator i = numValues.begin(); i != numValues.end(); i++) {
            os << "," << i->second;
        }
    } else {
        os << "STR," << a.values.size();
        for(set<const string>::const_iterator i = a.values.begin(); i != a.values.end(); i++) {
            os << "," << *i;
        }
    }
    return os;
}

void Attribute::add_value(const string& value) {
    values.insert(value);
}

/******************* AllAttributes *******************************************/

ostream& operator<<(ostream& os, const AllAttributes& a) {
    for(map<string,Attribute>::const_iterator i = a.all.begin(); i != a.all.end(); i++) {
        os << i->second << endl;
    }
    return os;
}

void AllAttributes::add(const string& name, Attribute::Type type) {
    Attribute a(name, type);
    all.insert(pair<string,Attribute>(name, a));
}

Attribute* AllAttributes::find(const string& name) {
    map<string,Attribute>::iterator it;
    it = all.find(name);
    if(it != all.end()) {
        return &(it->second);
    } else {
        return NULL;
    }
}
