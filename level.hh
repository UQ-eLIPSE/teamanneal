//
// level.hh
//

#ifndef LEVEL_HH
#define LEVEL_HH

#include <string>
#include <vector>

using namespace std;

class LevelNameIterator;

// Abstract base class
class Level {
public:
    enum NameType { NUMERICAL, CHARACTER, STRING };

    const string fieldName;
    Level::NameType type;

    int minSize;
    int idealSize;
    int maxSize;

    // Constructors
    Level(const string& fieldName, Level::NameType type);

    // Other member functions
    void set_sizes(int min, int ideal, int max);
    NameType get_type();

    // Pure virtual - this gets overwritten in the child classes
    virtual string getName(int teamNum) const = 0;
};

class NumericalLevel : public Level {
public:
    int startAt;	// usually 0 or 1
    bool leadingZeros;	// true if leading zeros are to be used when outputing this team number
    int numDigits;	// if leadingZeros is true, this is the field width to be used

    // Constructor
    NumericalLevel(const string& fieldName, int startAt);

    // Other member functions
    virtual string getName(int teamNum) const;
    void useLeadingZeros();
};

class CharacterLevel : public Level {
public:
    char startAt;	// usually 'a' or 'A'

    // Constructor
    CharacterLevel(const string& fieldName, char startAt);

    // Other member functions
    virtual string getName(int teamNum) const;
};

class StringLevel : public Level {
public:
    vector<string> names;

    // Constructor
    StringLevel(const string& fieldName);

    // Other member functions
    void add_name(const string& name);
    virtual string getName(int teamNum) const;
};

class LevelNameIterator {
private:
    const Level& level;
    int teamNum;
public:
    LevelNameIterator(const Level& level);
    string operator*();			// return value of current
    LevelNameIterator& operator++();	// prefix
    LevelNameIterator operator++(int); // postfix
};

#endif
