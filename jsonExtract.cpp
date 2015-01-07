//
// jsonExtract.cpp
//

#include "jsonExtract.hh"

// The following are strings we'll look for in the JSON
static const string versionString = "tool-version";
static const string identifierString = "identifier";
static const string partitionString = "partition";
static const string levelsString = "levels";
static const string nameFormatString = "name-format";
static const string constraintsString = "constraints";

// Prototype for version specific parsing functions
static AnnealInfo* json_parse_teamanneal_v1(JSONObject*);
static void json_parse_levels_v1(AnnealInfo*, JSONArray*);
static void json_parse_name_format_v1(AnnealInfo*, JSONObject*);
static void json_parse_constraints_v1(AnnealInfo*, JSONArray*);

AnnealInfo* json_to_anneal_info(JSONValue* value)
{
    if(value->get_type() != JSON_OBJECT) {
	throw ConstraintException("Expected top level JSON object");
    }
    JSONObject* obj = (JSONObject*)value;
    JSONValue* version = obj->find(versionString);
    if(!version) {
	throw ConstraintException("Expected tool version number in field ", versionString);
    }
    if(version->match("1") || version->match(1)) {
	// Data format v1 - string or number accepted
	return json_parse_teamanneal_v1(obj);
    } else {
	throw ConstraintException("Invalid constraint file version number");
    }
}

// Parse information from version 1 JSON object
AnnealInfo* json_parse_teamanneal_v1(JSONObject* obj)
{
    AnnealInfo* annealInfo = new AnnealInfo();
    bool foundIdentifier = false;

    // Iterate over all the fields of the object
    for(JSONObject::Iterator it = obj->iterator(); it != obj->end(); ++it) {
	if(it->first == identifierString) {
	    if(it->second->is_string()) {
		JSONString* str = (JSONString*)(it->second);
		annealInfo->set_id_field(str->get_value());
		foundIdentifier = true;
	    } else {
		throw ConstraintException("Expected string value for attribute ", identifierString);
	    }
	} else if(it->first == partitionString) {
	    if(it->second->is_string()) {
		JSONString* str = (JSONString*)(it->second);
		annealInfo->set_partition_field(str->get_value());
	    } else {
		throw ConstraintException("Expected string value for attribute ", partitionString);
	    }
	} else if(it->first == levelsString) {
	    if(it->second->is_array()) {
		json_parse_levels_v1(annealInfo, (JSONArray*)(it->second));
	    } else {
		throw ConstraintException("Expected array value for attribute ", levelsString);
	    }
	} else if(it->first == nameFormatString) {
	    if(it->second->is_object()) {
		json_parse_name_format_v1(annealInfo, (JSONObject*)(it->second));
	    } else {
		throw ConstraintException("Expected object value for attribute ", nameFormatString);
	    }
	} else if(it->first == constraintsString) {
	    if(it->second->is_array()) {
		json_parse_constraints_v1(annealInfo, (JSONArray*)(it->second));
	    } else {
		throw ConstraintException("Expected array value for attribute ", constraintsString);
	    }
	} else if(it->first == versionString) {
	    // Do nothing - we've already parsed this
	} else {
	    // Anything else is an invalid field
	    throw ConstraintException("Unexpected attribute ", it->first);
	}
    }
    return annealInfo;
}

static void json_parse_levels_v1(AnnealInfo* annealInfo, JSONArray* levelArray)
{
    Level* level;

    for(JSONArray::Iterator levelIterator = levelArray->iterator(); 
	    levelIterator != levelArray->end(); ++levelIterator) {
	// Each element in the level array should be a JSON object
	if(!(*levelIterator)->is_object()) {
	    throw ConstraintException("Level array should only contain JSON objects");
	}
	JSONObject* obj = (JSONObject*)(*levelIterator);
	// There must be attributes "field", "size" and "format" in this object - find them.
	// (Exception thrown if one is not found)
	JSONString* levelString = (JSONString*)obj->find("field", JSON_STRING);
	const string& levelName = levelString->get_value();
	JSONObject* sizeObject = (JSONObject*)obj->find("size", JSON_OBJECT);
	JSONObject* formatObject = (JSONObject*)obj->find("format", JSON_OBJECT);
	// The "format" object should have a "type" field
	JSONString* formatTypeString = (JSONString*)formatObject->find("type", JSON_STRING);
	if(formatTypeString->match("numerical-0")) {
	    level = new NumericalLevel(levelName, 0);
	} else if(formatTypeString->match("numerical-1")) {
	    level = new NumericalLevel(levelName, 1);
	} else if(formatTypeString->match("character-upper")) {
	    level = new CharacterLevel(levelName, 'A');
	} else if(formatTypeString->match("character-lower")) {
	    level = new CharacterLevel(levelName, 'a');
	} else if(formatTypeString->match("list")) {
	    StringLevel* stringLevel = new StringLevel(levelName);
	    // A list format type should have a values field which is an array of strings
	    JSONArray* valueArray = (JSONArray*)formatObject->find("values", JSON_ARRAY);
	    for(JSONArray::Iterator it = valueArray->iterator();
		    it != valueArray->end(); ++it) {
		// Each element in array should be a string
		if(!(*it)->is_string()) {
		    throw ConstraintException("Level names must be strings");
		}
		JSONString* teamNameString = (JSONString*)(*it);
		stringLevel->add_name(teamNameString->get_value());
	    }
	    level = stringLevel;
	} else {
	    throw ConstraintException("Unknown format type ", formatTypeString->get_value());
	}
	// If level is numerical - check for leading-0 attribute
	if(level->get_type() == Level::NUMERICAL) {
	    if(formatObject->has_attribute("leading-0")) {
		JSONBool* leading0 = (JSONBool*)formatObject->find("leading-0", JSON_BOOL);
		if(leading0->get_value() /* is true */) {
		    ((NumericalLevel*)level)->useLeadingZeros();
		}
	    }
	}

	// The "size" object should have three fields "min", "ideal", "max"
	JSONNumber* minNumber = (JSONNumber*)sizeObject->find("min", JSON_NUMBER);
	JSONNumber* idealNumber = (JSONNumber*)sizeObject->find("ideal", JSON_NUMBER);
	JSONNumber* maxNumber = (JSONNumber*)sizeObject->find("max", JSON_NUMBER);
	// Add these size requirements to our level.
	level->set_sizes((int)minNumber->get_value(), 
			 (int)idealNumber->get_value(), 
			 (int)maxNumber->get_value());
	annealInfo->add_level(level);
    }
}

static void json_parse_name_format_v1(AnnealInfo* annealInfo, JSONObject* nameFormatObject)
{
}

static void json_parse_constraints_v1(AnnealInfo* annealInfo, JSONArray* constraintArray)
{
}

///////////////////////////////////////////////////////////////////////////////
// ConstraintException
///////////////////////////////////////////////////////////////////////////////
ConstraintException::ConstraintException(const char* mesg)
{
    message = mesg;
}

ConstraintException::ConstraintException(const char* mesg1, const char* mesg2)
{
    message = mesg1;
    message += mesg2;
}

ConstraintException::ConstraintException(const char* mesg1, const string& mesg2)
{
    message = mesg1;
    message += mesg2;
}

const char* ConstraintException::what() const noexcept
{
    return message.c_str();
}
