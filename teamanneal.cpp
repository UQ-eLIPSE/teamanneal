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
#include "entity.hh"
#include "csv_output.hh"
#include "cost.hh"
#include "stats.hh"
#include "moveStats.hh"
#include "anneal.hh"
#include <fstream>
#include <assert.h>
#include <iostream>
#include <stdlib.h>	// for exit()

using namespace std;

///////////////////////////////////////////////////////////////////////////////
// Helper functions

[[noreturn]] static void print_usage_message_and_exit(const char* progName) 
{
    cerr << "Usage: " << progName << " cmd args ..." << endl;
    cerr << "Use" << endl << " " << progName << " help" << endl
	    << "for more information" << endl;
    exit(1);
}

static void print_help_message(const char* progName) 
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
static AllTeamData* set_up_data(AnnealInfo& annealInfo, const char* argv[])
{
    cout << "Parsing files" << endl;
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

///////////////////////////////////////////////////////////////////////////////
// create function
//
// argv[2] is team csv file
// argv[3] is constraint file name
// argv[4] is output csv file name
static void teamanneal_create(AllTeamData* teamData, const char* argv[])
{
    // Init stats
    stats_init(argv[2], argv[3], argv[4]);
    // Set up initial "random" teams
    teamData->populate_random_teams();
    initialise_costs(teamData);

    // Set the team names
    teamData->set_names_for_all_teams();

    // Do anneal
    anneal_all_partitions(teamData, allCostData);

    // Update column names if required and output the result
    teamData->get_anneal_info().update_column_names_if_required();
    output_csv_file_from_team_data(teamData, argv[4]);

    // Debug
    //cout << *teamData;

    ofstream ofs("cost_stats.txt");
    output_cost_data(ofs);

    stats_set_end_time();
    stats_add_for_all_partitions(teamData);
    stats_output(cout);
}

///////////////////////////////////////////////////////////////////////////////
// evaluate function
//
// argv[2] is team-csv-file
// argv[3] is constraint file name
static void teamanneal_evaluate(AllTeamData* teamData, const char* argv[])
{
    teamData->populate_existing_teams();
    initialise_costs(teamData);
    stats_init(argv[2], argv[3], "");
    stats_add_for_all_partitions(teamData);
    stats_output(cout);

    // Update column names if required and output the result
    //teamData->get_anneal_info().update_column_names_if_required();
    // Debug
    //output_csv_file_from_team_data(teamData, "out-evaluate.csv");
    //cout << *teamData;
}

///////////////////////////////////////////////////////////////////////////////
// move function
//
// argv[2] is team csv file
// argv[3] is constraint file name
// argv[4] is id of member to consider moving
static void teamanneal_move(AllTeamData* teamData, const char* argv[])
{
    teamData->populate_existing_teams();
    const Person* person = teamData->get_anneal_info().find_person_with_id(argv[4]);
    assert(person);
    initialise_costs(teamData);
    teamData->set_names_for_all_teams();		// FIX - do we need this
    calculate_move_stats(teamData, person);
    output_move_stats(cout);
}

///////////////////////////////////////////////////////////////////////////////
// swap function
//
// argv[2] is team csv file
// argv[3] is constraint file name
// argv[4] is id of member to consider swapping
static void teamanneal_swap(AllTeamData* teamData, const char* argv[])
{
    teamData->populate_existing_teams();
    const Person* person = teamData->get_anneal_info().find_person_with_id(argv[4]);
    assert(person);
    initialise_costs(teamData);
    teamData->set_names_for_all_teams();		// FIX - do we need this
    //swap_stats(teamData, person);
}

///////////////////////////////////////////////////////////////////////////////
// acquire function
//
// argv[2] is team csv file
// argv[3] is constraint file name
// argv[4] is name of team that we're considering adding a member to
// argv[5] (optional) is the name of the partition to restrict this analysis to
static void teamanneal_acquire(AllTeamData* teamData, const char* argv[])
{
    teamData->populate_existing_teams();
    //const TeamLevel* team = teamData->find_team(argv[4]);

    initialise_costs(teamData);
    teamData->set_names_for_all_teams();
}


///////////////////////////////////////////////////////////////////////////////
// main

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
	    } else if (argc < 4) {
		print_usage_message_and_exit(argv[0]);
	    } else {
		if(cmd.compare("create") == 0 && argc == 5) {
		    teamData = set_up_data(*annealInfo, argv);
		    teamanneal_create(teamData, argv);
		} else if(cmd.compare("evaluate") == 0 && argc == 4) {
		    teamData = set_up_data(*annealInfo, argv);
		    teamanneal_evaluate(teamData, argv);
		} else if(cmd.compare("move") == 0 && argc == 5) {
		    teamData = set_up_data(*annealInfo, argv);
		    teamanneal_move(teamData, argv);
		} else if(cmd.compare("swap") == 0 && argc == 5) {
		    teamData = set_up_data(*annealInfo, argv);
		    teamanneal_swap(teamData, argv);
		} else if(cmd == "acquire" && (argc == 5 || argc == 6)) {
		    teamData = set_up_data(*annealInfo, argv);
		    teamanneal_acquire(teamData, argv);
		} else {
		    // Invalid subcommand or incorrect number of arguments
		    print_usage_message_and_exit(argv[0]);
		}
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
