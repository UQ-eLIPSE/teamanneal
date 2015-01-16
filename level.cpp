//
// level.cpp
//

#include "level.hh"
#include <sstream>
#include <iomanip>

////////////// Level /////////////////////////////////////////////////////////

// Constructor
Level::Level(int levelNum, const string& fieldName, Level::NameType type) :
	levelNum(levelNum),
	fieldName(fieldName),
	type(type),
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

////////////// NumericalLevel /////////////////////////////////////////////////

// Constructor
NumericalLevel::NumericalLevel(int levelNum, const string& fieldName, int startAt) :
	Level(levelNum, fieldName, Level::NUMERICAL),
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
CharacterLevel::CharacterLevel(int levelNum, const string& fieldName, char startAt) :
	Level(levelNum, fieldName, Level::CHARACTER),
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
StringLevel::StringLevel(int levelNum, const string& fieldName) :
	Level(levelNum, fieldName, Level::STRING)
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

