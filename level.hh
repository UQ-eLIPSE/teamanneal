//
// level.hh
//

#ifndef LEVEL_HH
#define LEVEL_HH

#include <string>
#include <vector>
#include "attribute.hh"

using namespace std;

// Abstract base class
class Level {
public:
    enum NameType { NUMERICAL, CHARACTER, STRING, PARTITION };

protected:
    int levelNum;
    const string fieldName;	// May not be an existing attribute, so we store the name
    Attribute* attribute;	// If it is an existing attribute, store the pointer here
    				// nullptr if no corresponding attribute in the data
    Level::NameType type;
    Level* parentLevel;		// Pointer to the level above (null if this is the top level)
    Level* childLevel;

    int minSize;
    int idealSize;
    int maxSize;

public:
    // Constructors
    Level(Level* parentLevel, int levelNum, const string& fieldName, Attribute* attr,
	    Level::NameType type);

    // Other member functions
    int get_level_num() const;
    const string& get_field_name() const;
    Attribute* get_field_attribute() const;
    void set_sizes(int min, int ideal, int max);
    NameType get_type() const;
    int get_min_size() const;
    int get_ideal_size() const;
    int get_max_size() const;
    void add_child_level(Level* child);
    Level* get_parent_level() const;
    Level* get_child_level() const;
    bool is_lowest() const;
    bool is_highest() const;		// true if highest level (not partition)

    // Pure virtual - this gets overwritten in the child classes
    virtual string get_name(int teamNum, int numTeams) const = 0;
};

class NumericalLevel : public Level {
public:
    int startAt;	// usually 0 or 1
    bool leadingZeros;	// true if leading zeros are to be used when outputing this team number

    // Constructor
    NumericalLevel(Level* parentLevel, int levelNum, const string& fieldName, 
	    Attribute* attr, int startAt);

    // Other member functions
    virtual string get_name(int teamNum, int numTeams) const;
    void use_leading_zeros();
};

class CharacterLevel : public Level {
public:
    char startAt;	// usually 'a' or 'A'

    // Constructor
    CharacterLevel(Level* parentLevel, int levelNum, const string& fieldName, 
	    Attribute* attr, char startAt);

    // Other member functions
    virtual string get_name(int teamNum, int numTeams) const;
};

class StringLevel : public Level {
public:
    vector<string> names;

    // Constructor
    StringLevel(Level* parentLevel, int levelNum, const string& fieldName,
	    Attribute* attr);

    // Other member functions
    void add_name(const string& name);
    virtual string get_name(int teamNum, int numTeams) const;
};

class PartitionLevel : public Level {
public:
    // Constructor
    PartitionLevel(const string& fieldName, Attribute* attr);

    // Other member functions
    virtual string get_name(int teamNum, int numTeams) const;
};

#endif
