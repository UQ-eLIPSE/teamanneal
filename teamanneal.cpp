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
#include "csv_output.hh"
#include "cost.hh"
#include "stats.hh"

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
		teamData->populate_existing_teams();
		initialise_costs(teamData);

		// Update column names if required and output the result
		annealInfo->update_column_names_if_required();
		// Debug
		output_csv_file_from_team_data(teamData, "out-evaluate.csv");
		//cout << *teamData;
	    } else if((cmd == "create" || cmd == "move" || cmd == "swap") && argc == 5) {
		teamData = set_up_data(*annealInfo, argv);
		if(cmd == "create") {
		    // Init stats
		    stats_init(argv[2], argv[3], argv[4]);
		    // Set up initial "random" teams
		    teamData->populate_random_teams();
		    initialise_costs(teamData);
		    // Do anneal

		    // Set the team names
		    teamData->set_names_for_all_teams();

		    // Update column names if required and output the result
		    annealInfo->update_column_names_if_required();
		    output_csv_file_from_team_data(teamData, argv[4]);
		    // Debug
		    //cout << *teamData;
		    output_cost_data(cout);
		    stats_set_end_time();
		    stats_add_for_all_partitions(teamData);
		    stats_output(cout);
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
	} catch(string& s) {
	    cerr << s << endl;
	    exit(2);
	} catch(...) {
	    cerr << argv[0] << ": unknown exception" << endl;
	    exit(3);
	}
    }
    // Success
    return 0;
}
