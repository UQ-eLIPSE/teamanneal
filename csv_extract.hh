/*
 * csv_extract.hh
 */

#ifndef CSV_EXTRACT_HH
#define CSV_EXTRACT_HH

#include "annealInfo.hh"
#include "person.hh"
#include <vector>
#include <string>
extern "C" {
#include "csv.h"
}

using namespace std;

void extract_people_and_attributes_from_csv_data(AnnealInfo& annealInfo, CSV_File* data, const string& idField);

#endif
