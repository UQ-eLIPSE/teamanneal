//
// annealinfo.hh
//

#ifndef ANNEALINFO_HH
#define ANNEALINFO_HH

#include "constraint.hh"
#include "person.hh"
#include "level.hh"
#include <vector>
#include <string>

using namespace std;

class AnnealInfo {
private:
    vector<Person*> 		allPeople;
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
    Attribute* get_attribute(unsigned int i);		// return i'th attribute (0 based count)
    Attribute* find_attribute(const string& name);	// return nullptr if not found
    void set_id_attribute(Attribute* idAttr);

    // Person functions
    vector<Person*>& all_people();
    void add_person(Person* person);
    int num_people();
    int count_people_with_attribute_value(Attribute* attr, const string& strValue);

    // Partition functions
    void set_partition_field(const string& fieldName);
    Attribute* get_partition_field();

    // Level functions
    vector<Level*>& all_levels();
    void add_level(Level* level);
    int num_levels();

    // Constraint functions
    void add_constraint(Constraint* constraint);

    // Team name functions
    void set_team_name_format(const string& format);
    void set_team_name_field(const string& fieldName);

    int num_constraints();
    Constraint* get_constraint(int n);
    // Get the n'th level - where n is 1 based
    Level* get_level(int n);
    //Attribute* get_partition_field();
    //Attribute* get_id_field();
    const string& get_team_name_format();
    const string& get_team_name_field();
};

#endif

