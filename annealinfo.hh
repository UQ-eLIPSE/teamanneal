//
// annealinfo.hh
//

#ifndef ANNEALINFO_HH
#define ANNEALINFO_HH

#include "constraint.hh"
#include "level.hh"
#include <vector>
#include <string>

using namespace std;

class AnnealInfo {
private:
    vector<Constraint*> allConstraints;
    vector<Level*> allLevels;
    string partitionFieldName;
    string idFieldName;
    Attribute* partitionField;
    Attribute* idField;
    string nameFormat;

public:
    // Constructor
    AnnealInfo();

    // Other member functions
    void add_constraint(Constraint* constraint);
    void add_level(Level* level);
    void set_partition_field(const string& fieldName);
    void set_id_field(const string& fieldName);
    void set_name_format(const string& format);

    int num_constraints();
    int num_levels();
    Constraint* get_constraint(int n);
    // Get the n'th level - where n is 1 based
    Level* get_level(int n);
    Attribute* get_partition_field();
    Attribute* get_id_field();
    const string& get_name_format();
};

#endif

