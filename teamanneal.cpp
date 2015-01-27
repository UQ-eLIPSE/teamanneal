/*
 * teamanneal.cpp
 * 
 * Main file for team creation tool (TeamAnneal)
 *
 * Command line usage is 
 *	teamanneal <cmd> <args>...
 */

#include "jsonExtract.hh"
#include "csv_extract.hh"
#include "filedata.hh"
#include "teamData.hh"


#include <iostream>
#include <stdlib.h>	// for exit()

using namespace std;

[[noreturn]] void print_usage_message_and_exit(const char* progName) 
{
    cerr << "Usage: " << progName << " cmd args ..." << endl;
    cerr << "Use" << endl << " " << progName << " help" << endl
	    << "for more information" << endl;
    exit(1);
}

void print_help_message(const char* progName) 
{
    cout << "Usage: " << progName << " subcommand args ..." << endl;
    cout << "Subcommands are:\n\
help\n\
    - output this message to standard output\n\
create input-team-csv-file constraint-json-file output-team-csv-file\n\
    - performs simulated annealing to create new teams. Outputs JSON stats to stdout\n\
      when complete. Outputs progress messages to stderr whilst in progress.\n\
evaluate team-csv-file constraint-json-file\n\
    - takes a populated team file (which should be the result of annealing/editing) and\n\
      outputs JSON stats to stdout about constraint performance\n\
move team-csv-file constraint-json-file member-id\n\
    - determines the costs for moving the given person to all other teams. Outputs JSON\n\
      result to stdout.\n\
swap team-csv-file constraint-json-file member-id\n\
    - determines the costs for swapping the given person with everyone in all other teams.\n\
      Outputs JSON result to stdout.\n\
acquire team-csv-file constraint-json-file team-name [partition-name]\n\
    - determines the costs for bringing all people not in this team into the given team.\n\
      If partitions are used then the team's partition must be given as an argument.\n\
      Outputs JSON result to stdout.\n\
\n\
";
}

// Extract data from the files referred to on the command line - argv[2] and argv[3]
// Create the initial team allocation - either from existing data in the CSV file or 
// randomly.
AllTeamData* set_up_data(AnnealInfo& annealInfo, const char* argv[])
{
    // Read team file and parse the CSV 
    FileData* teamFileData = new FileData(argv[2]);
    CSV_File* csvContents = new CSV_File(teamFileData->getContents(), ',', '"', 1);

    // Read constraint file
    JSONValue* constraintJSON = JSONValue::readJSON(argv[3]);

    // Extract identifier field information from the constraint JSON
    const string& idFieldName = get_identifier_from_json_object(constraintJSON);

    // Parse the CSV to generate our list of attributes and list of people
    extract_people_and_attributes_from_csv_data(annealInfo, csvContents, idFieldName);

    // Parse the JSON to get our constraints
    extract_constraints_from_json_data(annealInfo, constraintJSON);

    // Create the initial teams and return them
    return new AllTeamData(annealInfo);
}


int main(int argc, const char* argv[]) 
{
    AnnealInfo* annealInfo = new AnnealInfo();
    AllTeamData* teamData;

    if(argc < 2) {
	print_usage_message_and_exit(argv[0]);
    } else {
	string cmd = argv[1];
	try {
	    if(cmd == "help") {
		print_help_message(argv[0]);
	    } else if(cmd == "evaluate" && argc == 4) {
		teamData = set_up_data(*annealInfo, argv);
	    } else if((cmd == "create" || cmd == "move" || cmd == "swap") && argc == 5) {
		teamData = set_up_data(*annealInfo, argv);
		if(cmd == "create") {
		    //teamData->output(argv[4]);
		}
	    } else if(cmd == "acquire" && (argc == 5 || argc == 6)) {
		teamData = set_up_data(*annealInfo, argv);
	    } else {
		// Invalid subcommand or incorrect number of arguments
		print_usage_message_and_exit(argv[0]);
	    }
	} catch(std::exception& e) {
	    // Some sort of error occurred - print it and exit
	    // Possible errors are file related (file doesn't exit) or syntax errors
	    // inside a file.
	    cerr << argv[0] << ": " << e.what() << endl;
	    exit(2);
	} catch(...) {
	    cerr << argv[0] << ": unknown exception" << endl;
	    exit(3);
	}
    }
    // Success
    return 0;
}
