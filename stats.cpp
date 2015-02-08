//
// stats.cpp
//

#include "stats.hh"
#include "json.hh"
#include <ctime>

#define TIME_FORMAT "%Y-%m-%d %H:%M:%S"

static JSONObject* statsJSON = nullptr;

void stats_init(const string& inputCSVFileName,
		      const string& inputConstraintFilename,
		      const string& outputCSVFileName)
{
    statsJSON = new JSONObject();
    statsJSON->append("input-csv-file-name", inputCSVFileName);
    statsJSON->append("constraint-file-name", inputConstraintFilename);
    statsJSON->append("output-csv-file-name", outputCSVFileName);

    // Get start time
    time_t now;
    struct tm * timeinfo;

    time(&now);
    timeinfo = localtime(&now);
    char startTimeBuf[80];
    strftime(startTimeBuf, 80, TIME_FORMAT, timeinfo);
    string startTime = startTimeBuf;
    statsJSON->append("start-time", startTime);

}
