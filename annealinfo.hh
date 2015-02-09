//
// annealinfo.hh
//

#ifndef ANNEALINFO_HH
#define ANNEALINFO_HH

#include "constraint.hh"
#include "attribute.hh"
#include "person.hh"
#include "level.hh"
#include <vector>
#include <string>

using namespace std;

class AnnealInfo {
private:
    vector<const Person*> 		allPeople;
    vector<Constraint*> 	allConstraints;
    vector<Attribute*> 		allAttributes;
    map<string, Attribute*> 	attributeMap;
    Attribute* 			idField;
    Attribute* 			partitionField; 	// nullptr if none
    vector<Level*> 		allLevels;
    string 			teamNameField;
    string 			teamNameFormat;

public:
    // Constructor
    AnnealInfo();

    // Other member functions
    // Attribute functions
    void add_attribute(Attribute* attr);
    int num_attributes();
    Attribute* get_attribute(unsigned int i);		// return i'th attribute (0 based count)
    Attribute* find_attribute(const string& name);	// return nullptr if not found
    void set_id_attribute(Attribute* idAttr);

    // Person functions
    vector<const Person*>& all_people();
    void add_person(const Person* person);
    int num_people();
    int count_people_with_attribute_value(Attribute* attr, const string& strValue);

    // Partition functions
    void set_partition_field(const string& fieldName);
    Attribute* get_partition_field();

    // Level functions - the topmost level is the partition
    const vector<Level*>& all_levels() const;
    void add_level(Level* level);
    int num_levels() const;		// Excluding partition level
    // Get the n'th level (0 = partition, 1 = top level)
    Level* get_level(int n) const;

    // Constraint functions
    void add_constraint(Constraint* constraint);
    int num_constraints();
    Constraint* get_constraint(int n);
    const vector<Constraint*>& all_constraints() const;
    //Attribute* get_partition_field();
    //Attribute* get_id_field();

    // Team name functions
    const string& get_team_name_format();
    const string& get_team_name_field();
    void set_team_name_format(const string& format);
    void set_team_name_field(const string& fieldName);

    // Other functions
    // Update column (attribute) names if we have to output a column which may have the 
    // same name as an existing column then we rename the old column by appending/incrementing
    // a number on the end of the column name until the column name is unique
    void update_column_names_if_required();
};

#endif

