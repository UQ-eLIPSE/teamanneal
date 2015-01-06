//
// level.cpp
//

#include "level.hh"
#include <sstream>
#include <iomanip>

////////////// Level /////////////////////////////////////////////////////////

// Constructor
Level::Level(const string& fieldName, Level::NameType type) :
	fieldName(fieldName),
	type(type),
	minSize(0),
	idealSize(0),
	maxSize(0)
{
}

// Other member functions
void Level::setSizes(int min, int ideal, int max)
{
    minSize = min;
    idealSize = ideal;
    maxSize = max;
}

////////////// NumericalLevel /////////////////////////////////////////////////

// Constructor
NumericalLevel::NumericalLevel(const string& fieldName) :
	Level(fieldName, Level::NUMERICAL),
	startAt(1),
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

////////////// CharacterLevel /////////////////////////////////////////////////

// Constructor
CharacterLevel::CharacterLevel(const string& fieldName) :
	Level(fieldName, Level::CHARACTER),
	startAt('A')
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
StringLevel::StringLevel(const string& fieldName) :
	Level(fieldName, Level::STRING)
{
}

// Other member functions
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

