//
// jsonExtract.cpp
//

#include "jsonExtract.hh"
#include <sstream>

// The following are strings we'll look for in the JSON
static const string VERSION_STRING = "tool-version";
static const string IDENTIFIER_STRING = "identifier";
static const string PARTITION_STRING = "partition";
static const string LEVELS_STRING = "levels";
static const string NAME_FORMAT_STRING = "name-format";
static const string CONSTRAINTS_STRING = "constraints";

static const double MUST_HAVE_WEIGHT = 1000.0;
static const double SHOULD_HAVE_WEIGHT = 50.0;
static const double IDEALLY_HAS_WEIGHT = 10.0;
static const double COULD_HAVE_WEIGHT = 2.0;

// Prototype for version specific parsing functions
static void json_parse_teamanneal_v1(AnnealInfo&, JSONObject*);
static void json_parse_levels_v1(AnnealInfo&, Attribute* partition, JSONArray*);
static void json_parse_name_format_v1(AnnealInfo&, JSONObject*);
static void json_parse_constraints_v1(AnnealInfo&, JSONArray*);

const string& get_identifier_from_json_object(JSONValue* val)
{
    if(!val->is_object()) {
	throw ConstraintException("Expected top level JSON object");
    }
    return ((JSONObject*)val)->find_string(IDENTIFIER_STRING);
}

void extract_constraints_from_json_data(AnnealInfo& annealInfo, JSONValue* value)
{
    if(value->get_type() != JSON_OBJECT) {
	throw ConstraintException("Expected top level JSON object");
    }
    JSONObject* obj = (JSONObject*)value;
    JSONValue* version = obj->find(VERSION_STRING);
    if(!version) {
	throw ConstraintException("Expected tool version number in field ", VERSION_STRING);
    }
    if(version->match("1") || version->match(1)) {
	// Data format v1 - string or number accepted
	json_parse_teamanneal_v1(annealInfo, obj);
    } else {
	throw ConstraintException("Invalid constraint file version number");
    }
}

// Parse information from version 1 JSON object
void json_parse_teamanneal_v1(AnnealInfo& annealInfo, JSONObject* obj)
{
    // Default partition (i.e. none)
    Attribute* partitionFieldAttribute = nullptr;

    // If there is a partition attribute, process it first
    if(obj->has_attribute(PARTITION_STRING)) {
	JSONValue* jsonValue = obj->find(PARTITION_STRING);
	if(jsonValue->is_string()) {
	    JSONString* jsonString = (JSONString*)jsonValue;
	    annealInfo.set_partition_field(jsonString->get_value());
	    partitionFieldAttribute = annealInfo.get_partition_field();
	    if(!partitionFieldAttribute) {
		throw ConstraintException("Partition field not found: ", jsonString->get_value());
	    }
	} else if(jsonValue->is_null()) {
	    // No partition specified - no need to do anything
	} else {
	    throw ConstraintException("Expected string value for attribute ", PARTITION_STRING);
	}
    }

    if(obj->has_attribute(LEVELS_STRING) && obj->find(LEVELS_STRING)->is_array()) {
	// Found levels array
	JSONArray* levelsJSONArray = (JSONArray*)(obj->find(LEVELS_STRING));
	json_parse_levels_v1(annealInfo, partitionFieldAttribute, levelsJSONArray);
    } else {
	throw ConstraintException("Did not find array attribute ", LEVELS_STRING);
    }

    if(obj->has_attribute(NAME_FORMAT_STRING) && obj->find(NAME_FORMAT_STRING)->is_object()) {
	// Found name format
	JSONObject* nameFormatJSONObject = (JSONObject*)(obj->find(NAME_FORMAT_STRING));
	json_parse_name_format_v1(annealInfo, nameFormatJSONObject);
    } else {
	throw ConstraintException("Did not find object attribute ", NAME_FORMAT_STRING);
    }

    if(obj->has_attribute(CONSTRAINTS_STRING) && obj->find(CONSTRAINTS_STRING)->is_array()) {
	// Found levels array
	JSONArray* constraintsJSONArray = (JSONArray*)(obj->find(CONSTRAINTS_STRING));
	json_parse_constraints_v1(annealInfo, constraintsJSONArray);
    } else {
	throw ConstraintException("Did not find array attribute ", CONSTRAINTS_STRING);
    }

    // Iterate over all the fields of the object to make sure we don't have any invalid fields
    for(JSONObject::Iterator it = obj->iterator(); it != obj->end(); ++it) {
	if(it->first != VERSION_STRING &&
		it->first != IDENTIFIER_STRING &&
		it->first != PARTITION_STRING &&
		it->first != LEVELS_STRING &&
		it->first != NAME_FORMAT_STRING &&
		it->first != CONSTRAINTS_STRING) {
	    // Anything else is an invalid field
	    throw ConstraintException("Unexpected attribute ", it->first);
	}
    }
}

static void json_parse_levels_v1(AnnealInfo& annealInfo, Attribute* partitionAttr,
	JSONArray* levelArray)
{
    Level* level;

    // Use the partition information (if set) to create the very top level (0)
    if(partitionAttr) {
	level = new PartitionLevel(partitionAttr->get_name(), partitionAttr);
    } else {
	level = new PartitionLevel("", nullptr);
    }
    annealInfo.add_level(level);

    Level* parentLevel = level;
    int levelNum = 1;
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
	// Get the name of this level (e.g. "Team"). We also see if this corresponds to an attribute
	// in our data (it may not, attr will be a null pointer in this case
	const string& levelName = levelString->get_value();
	Attribute* attr = annealInfo.find_attribute(levelName);	// could be nullptr
	JSONObject* sizeObject = (JSONObject*)obj->find("size", JSON_OBJECT);
	JSONObject* formatObject = (JSONObject*)obj->find("format", JSON_OBJECT);
	// The "format" object should have a "type" field
	JSONString* formatTypeString = (JSONString*)formatObject->find("type", JSON_STRING);
	if(formatTypeString->match("numerical-0")) {
	    level = new NumericalLevel(parentLevel, levelNum, levelName, attr, 0);
	} else if(formatTypeString->match("numerical-1")) {
	    level = new NumericalLevel(parentLevel, levelNum, levelName, attr, 1);
	} else if(formatTypeString->match("character-upper")) {
	    level = new CharacterLevel(parentLevel, levelNum, levelName, attr, 'A');
	} else if(formatTypeString->match("character-lower")) {
	    level = new CharacterLevel(parentLevel, levelNum, levelName, attr, 'a');
	} else if(formatTypeString->match("list")) {
	    StringLevel* stringLevel = new StringLevel(parentLevel, levelNum, levelName, attr);
	    // A list format type should have a values field which is an array of strings
	    JSONArray* valueArray = (JSONArray*)formatObject->find("values", JSON_ARRAY);
	    for(JSONArray::Iterator it = valueArray->iterator();
		    it != valueArray->end(); ++it) {
		// Each element in array should be a string
		if(!(*it)->is_string()) {
		    throw ConstraintException("Team names must be strings at level ", levelName);
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
		    ((NumericalLevel*)level)->use_leading_zeros();
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
	annealInfo.add_level(level);
	++levelNum;
	// This level will be the parent for the next level (if any)
	parentLevel = level;
    }
    //cout << "Number of levels: " << annealInfo.num_levels() << endl;
}

static void json_parse_name_format_v1(AnnealInfo& annealInfo, JSONObject* nameFormatObject)
{
    JSONString* fieldNameString = (JSONString*)nameFormatObject->find("field", JSON_STRING);
    JSONString* formatString = (JSONString*)nameFormatObject->find("format", JSON_STRING);
    annealInfo.set_team_name_format(formatString->get_value());
    annealInfo.set_team_name_field(fieldNameString->get_value());
}

static void json_parse_constraints_v1(AnnealInfo& annealInfo, JSONArray* constraintArray)
{
    Constraint* constraint;
    Constraint::Type constraintType;
    Constraint::Operation operation;

    for(JSONArray::Iterator it = constraintArray->iterator();
	    it != constraintArray->end(); ++it) {
	// Each element in the array should be a JSON object
	if(!(*it)->is_object()) {
	    throw ConstraintException("Constraint array should only contain JSON objects");
	}
	JSONObject* obj = (JSONObject*)(*it);
	// There must be attributes "level", "weight", "operator", "field"
	// There MAY be attributes "of-size", "count", "field-operator", "field-value"

	double level = obj->find_number("level");
	if(level != 1.0 && level != 2.0 and level !=3.0) {
	    throw ConstraintException("Constraint level must be 1, 2 or 3");
	}
	if(level > annealInfo.num_levels()) {
	    throw ConstraintException("Invalid constraint level - not that many levels ", level);
	}

	const string& operatorString = obj->find_string("operator");
	if(operatorString == "exactly") {
	    constraintType = Constraint::COUNT_EXACT;
	} else if(operatorString == "not exactly") {
	    constraintType = Constraint::COUNT_NOT_EXACT;
	} else if(operatorString == "at least") {
	    constraintType = Constraint::COUNT_AT_LEAST;
	} else if(operatorString == "at most") {
	    constraintType = Constraint::COUNT_AT_MOST;
	} else if(operatorString == "as many as possible") {
	    constraintType = Constraint::COUNT_MAXIMISE;
	} else if(operatorString == "as few as possible") {
	    constraintType = Constraint::COUNT_MINIMISE;
	} else if(operatorString == "as similar as possible") {
	    constraintType = Constraint::HOMOGENEOUS;
	} else if(operatorString == "as different as possible") {
	    constraintType = Constraint::HETEROGENEOUS;
	} else {
	    throw ConstraintException("Constraint operator must be one of 'exactly','not exactly',"
		    "'at least','at most',"
		    "'as similar as possible','as different as possible','as many as possible',"
		    "'as few as possible' not ", operatorString);
	}

	string weightString = obj->find_string("weight");
	double weight;
	if(weightString == "must have") {
	    weight = MUST_HAVE_WEIGHT;
	} else if(weightString == "should have") {
	    weight = SHOULD_HAVE_WEIGHT;
	} else if(weightString == "ideally has") {
	    weight = IDEALLY_HAS_WEIGHT;
	} else if(weightString == "could have") {
	    weight = COULD_HAVE_WEIGHT;
	} else {
	    throw ConstraintException("Constraint weight must be one of 'must have','should have',"
		    "'ideally has','could have' not ", weightString);
	}
	const string& field = obj->find_string("field");
	Attribute* attr = annealInfo.find_attribute(field);
	if(!attr) {
	    throw ConstraintException("Unknown field name: ", field);
	}

	if(constraintType == Constraint::HOMOGENEOUS || 
		constraintType == Constraint::HETEROGENEOUS) {
	    constraint = new SimilarityConstraint(constraintType, field, (int)level, weight);
	} else {
	    // Count constraint
	    CountConstraint* countConstraint;
	    // There must be "field-operator" and "field-value" attributes
	    // The field-value attribute could be numerical or string
	    // There will be a "count" attribute if the type is COUNT_EXACT, COUNT_NOT_EXACT,
	    // COUNT_AT_LEAST, COUNT_AT_MOST
	    const string& fieldOperatorString = obj->find_string("field-operator");
	    if(fieldOperatorString == "equal to") {
		operation = Constraint::EQUAL;
	    } else if(fieldOperatorString == "not equal to") {
		operation = Constraint::NOT_EQUAL;
	    } else if(fieldOperatorString == "less than or equal to") {
		operation = Constraint::LESS_THAN_OR_EQUAL;
	    } else if(fieldOperatorString == "less than") {
		operation = Constraint::LESS_THAN;
	    } else if(fieldOperatorString == "greater than or equal to") {
		operation = Constraint::GREATER_THAN_OR_EQUAL;
	    } else if(fieldOperatorString == "greater than") {
		operation = Constraint::GREATER_THAN;
	    } else {
		throw ConstraintException("Constraint field-operator should be one of 'equal to',"
			"'not equal to','less than or equal to','less than',"
			"'greater than or equal to','greater than' not ", fieldOperatorString);
	    }
	    JSONValue* fieldValue = obj->find("field-value");
	    if(fieldValue->is_string()) {
		// Check operation has correct type
		if(operation != Constraint::EQUAL && operation != Constraint::NOT_EQUAL) {
		    throw ConstraintException("String constraints can only use 'equal to' or "
			    "'not equal to' not ", fieldOperatorString);
		}
		countConstraint = new CountStringConstraint(constraintType, field, operation,
			((JSONString*)fieldValue)->get_value(), (int)level, weight);
	    } else if(fieldValue->is_number()) {
		countConstraint = new CountNumberConstraint(constraintType, field, operation,
			((JSONNumber*)fieldValue)->get_value(), (int)level, weight);
	    } else {
		throw ConstraintException("Constraint field-value should be number or string");
	    }
	    if(constraintType == Constraint::COUNT_EXACT || 
		    constraintType == Constraint::COUNT_NOT_EXACT ||
		    constraintType == Constraint::COUNT_AT_LEAST ||
		    constraintType == Constraint::COUNT_AT_MOST) {
		double count = obj->find_number("count");
		countConstraint->set_target((int)count);
	    }
	    constraint = countConstraint;
	}
	if(obj->has_attribute("of-size")) {
	    constraint->set_applicable_team_size((int)(obj->find_number("of-size")));
	}
	annealInfo.add_constraint(constraint);
    }
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

ConstraintException::ConstraintException(const char* mesg1, double d)
{
    ostringstream strs;
    strs << d;

    message = mesg1;
    message += "(";
    message += strs.str();
    message += ")";
}

const char* ConstraintException::what() const noexcept
{
    return message.c_str();
}
