/*
 * csv_extract.hh
 */

#ifndef CSV_EXTRACT_HH
#define CSV_EXTRACT_HH

#include "annealinfo.hh"
#include "person.hh"
#include <vector>
#include <string>
#include "csv.hh"

using namespace std;

void extract_people_and_attributes_from_csv_data(AnnealInfo& annealInfo, CSV_File* data, const string& idField);

#endif
