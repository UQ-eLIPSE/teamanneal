PROGRAMS = filedata_test csv_test json_test teamanneal test_team_size
FILEDATA_TEST_OBJECTS = filedata.o filedata_test.o exceptions.o
CSV_TEST_OBJECTS = csv.o csv_test.o filedata.o exceptions.o
JSON_TEST_OBJECTS = filedata.o jsonExceptions.o json.o json_test.o exceptions.o stringCursor.o
TEST_TEAM_SIZE_OBJECTS = test_team_size.o teamData.o annealInfo.o attribute.o person.o level.o \
	exceptions.o entity.o entityList.o memberIterator.o constraint.o
TEAMANNEAL_OBJECTS = teamanneal.o csv.o csv_extract.o person.o attribute.o exceptions.o filedata.o \
	annealInfo.o json.o jsonExtract.o jsonExceptions.o stringCursor.o level.o constraint.o \
	teamData.o csv_output.o constraintCost.o entity.o memberIterator.o entityList.o cost.o \
	constraintCostList.o stats.o moveStats.o anneal.o moveSet.o

OBJS = $(FILEDATA_TEST_OBJECTS) $(CSV_TEST_OBJECTS) $(JSON_TEST_OBJECTS) \
	$(TEST_TEAM_SIZE_OBJECTS) $(TEAMANNEAL_OBJECTS) 

# Default C compiler
CC=gcc

# Default C++ compiler
CXX=g++

# Default C compilation options
# CFLAGS=-Wall -MMD -Ofast
CFLAGS=-Wall -MMD -g

#Default C++ compilation options
#CXXFLAGS=-Wall -std=c++11 -MMD -g -DDEBUG -DRECALCULATE_COSTS_FROM_SCRATCH_TO_DOUBLE_CHECK -DCONSTANT_RANDOM_SEED -DSINGLE_THREAD
#CXXFLAGS=-Wall -std=c++11 -MMD -g -DDEBUG -DRECALCULATE_COSTS_FROM_SCRATCH_TO_DOUBLE_CHECK -DCONSTANT_RANDOM_SEED -DSINGLE_THREAD
CXXFLAGS=-Wall -std=c++11 -MMD -O3

all: $(PROGRAMS)

filedata_test: $(FILEDATA_TEST_OBJECTS)
	$(CXX) -o $@ $^ -pthread

csv_test: $(CSV_TEST_OBJECTS)
	$(CXX) -o $@ $^ -pthread

json_test: $(JSON_TEST_OBJECTS)
	$(CXX) -o $@ $^ -pthread

teamanneal: $(TEAMANNEAL_OBJECTS)
	$(CXX) -o $@ $^ -pthread

test_team_size: $(TEST_TEAM_SIZE_OBJECTS)
	$(CXX) -o $@ $^ -pthread

clean:
	rm -f $(PROGRAMS) *.o *.d

# Include dependencies for each source
-include $(OBJS:%.o=%.d)
