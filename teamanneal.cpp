/*
 * teamanneal.cpp
 * 
 * Main file for team creation tool (TeamAnneal)
 *
 * Command line usage is 
 *	teamanneal <cmd> <args>...
 */

#include "csv_extract.hh"
#include "csv.h"
#include "filedata.hh"
#include "jsonExtract.hh"

#include <iostream>
#include <stdlib.h>	// for exit()

using namespace std;

[[noreturn]] void print_usage_message_and_exit(const char* progName) {
    cerr << "Usage: " << progName << " cmd args ..." << endl;
    cerr << "Use" << endl << " " << progName << " help" << endl
	    << "for more information" << endl;
    exit(1);
}

void print_help_message(const char* progName) {
    cout << "Usage: " << progName << " subcommand args ..." << endl;
    cout << "Subcommands are:\n\
help\n\
    - output this message to standard output\n\
attributes team-csv-file\n\
    - returns JSON description of the attributes in the csv file\n\
create input-team-csv-file constraint-json-file output-team-csv-file\n\
    - performs simulated annealing to create new teams. Outputs JSON stats to stdout\n\
      when complete. Outputs progress messages to stderr whilst in progress\n\
move team-csv-file constraint-json-file member-id\n\
    - determines the costs for moving the given person to all other teams. Outputs JSON\n\
      result to stdout\n\
swap team-csv-file constraint-json-file member-id\n\
    - determines the costs for swapping the given person with everyone in all other teams.\n\
      Outputs JSON result to stdout\n\
steal team-csv-file constraint-json-file team-name\n\
    - determines the costs for bringing all people not in this team into the given team\n\
\n\
";
}



int main(int argc, const char* argv[]) {
    FileData* teamFileData;
    CSV_File* teamfile;
    JSONValue* constraintJSON;
    AnnealInfo* annealInfo;

    if(argc < 2) {
	print_usage_message_and_exit(argv[0]);
    } else {
	string cmd = argv[1];
	try {
	    if(cmd == "help") {
		print_help_message(argv[0]);
	    } else if(cmd == "attributes" && argc == 3) {
		teamFileData = new FileData(argv[2]);
		teamfile = process_csv_file(teamFileData->getContents(), ',', '"', 1);
	    } else if((cmd == "create" || cmd == "move" || cmd == "swap" || cmd == "steal")
		    && argc == 5) {
		teamFileData = new FileData(argv[2]);
		teamfile = process_csv_file(teamFileData->getContents(), ',', '"', 1);
		constraintJSON = JSONValue::readJSON(argv[3]);
		annealInfo = json_to_anneal_info(constraintJSON);
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
