//
// level.cpp
//

#include "level.hh"
#include <sstream>
#include <iomanip>
#include <assert.h>

////////////// Level /////////////////////////////////////////////////////////

// Constructor
Level::Level(Level* parentLevel, int levelNum, const string& fieldName, Attribute* attr,
		Level::NameType type) :
	levelNum(levelNum),
	fieldName(fieldName),
	attribute(attr),
	type(type),
	parentLevel(parentLevel),
	childLevel(nullptr),
	minSize(0),
	idealSize(0),
	maxSize(0)
{
}

// Other member functions
int Level::get_level_num()
{
    return levelNum;
}

const string& Level::get_field_name() const
{
    return fieldName;
}

Attribute* Level::get_field_attribute() const
{
    return attribute;
}

void Level::set_sizes(int min, int ideal, int max)
{
    minSize = min;
    idealSize = ideal;
    maxSize = max;
}

Level::NameType Level::get_type()
{
    return type;
}

int Level::get_min_size()
{
    return minSize;
}

int Level::get_ideal_size()
{
    return idealSize;
}

int Level::get_max_size()
{
    return maxSize;
}

void Level::add_child_level(Level* child)
{
    assert(!childLevel);	// Can't already have a child
    childLevel = child;
}

Level* Level::get_parent_level() const
{
    return parentLevel;
}

Level* Level::get_child_level() const
{
    assert(childLevel);	// must not be null
    return childLevel;
}

bool Level::is_lowest() const
{
    return (childLevel == nullptr);
}

bool Level::is_highest() const
{
    return (levelNum == 1);
}

////////////// NumericalLevel /////////////////////////////////////////////////

// Constructor
NumericalLevel::NumericalLevel(Level* parentLevel, int levelNum, 
		const string& fieldName, Attribute* attr, int startAt) :
	Level(parentLevel, levelNum, fieldName, attr, Level::NUMERICAL),
	startAt(startAt),
	leadingZeros(false),
	numDigits(0)
{
}

// Other member functions
string NumericalLevel::getName(int teamNum) const
{
    std::stringstream s;
    // Apply print format
    if(numDigits > 0) {
	s << std::setw(numDigits) << std::setfill('0') << teamNum;
    } else {
	s << teamNum;
    }
    return s.str();
}

void NumericalLevel::use_leading_zeros()
{
    leadingZeros = true;
}

////////////// CharacterLevel /////////////////////////////////////////////////

// Constructor
CharacterLevel::CharacterLevel(Level* parentLevel, int levelNum, 
		const string& fieldName, Attribute* attr, char startAt) :
	Level(parentLevel, levelNum, fieldName, attr, Level::CHARACTER),
	startAt(startAt)
{
}

// Other member functions
string CharacterLevel::getName(int teamNum) const
{
    // startAt will be 'a' or 'A' - print team number as a,b,z,aa,bb,cc etc or A,B,..Z,AA,BB etc.
    std::stringstream s;
    int tmpTeamNum = teamNum;
    do {
	s << (startAt + (teamNum % 26));
	tmpTeamNum -= 26;
    } while(tmpTeamNum >= 0);
    return s.str();
}

////////////// StringLevel ////////////////////////////////////////////////////

// Constructor
StringLevel::StringLevel(Level* parentLevel, int levelNum, const string& fieldName,
		Attribute* attr) :
	Level(parentLevel, levelNum, fieldName, attr, Level::STRING)
{
}

// Other member functions
void StringLevel::add_name(const string& name)
{
    names.push_back(name);
}

string StringLevel::getName(int teamNum) const
{
    std::stringstream s;
    if(teamNum < names.size()) {
	s << names[teamNum];
    } else {
	s << names[teamNum % names.size()] << "-" << (teamNum / names.size());
    }
    return s.str();
}

////////////// PartitionLevel /////////////////////////////////////////////////

// Constructor
PartitionLevel::PartitionLevel(const string& fieldName, Attribute* attr) :
	Level(nullptr, 0, fieldName, attr, Level::PARTITION)
{
}

string PartitionLevel::getName(int teamNum) const
{
    // FIX - WHAT SHOULD THIS BE
    return "";
}

////////////// LevelNameIterator //////////////////////////////////////////////

// Constructor
LevelNameIterator::LevelNameIterator(const Level& level) :
	level(level),
	teamNum(0)
{
}

// Operators
string LevelNameIterator::operator*()
{
    return level.getName(teamNum);
}

LevelNameIterator& LevelNameIterator::operator++()	// prefix
{
    teamNum++;
    return (*this);
}

LevelNameIterator LevelNameIterator::operator++(int)	// postfix
{
    LevelNameIterator tmp(*this);	// Copy iterator to preserve the state before increment
    teamNum++;
    return tmp;
}

