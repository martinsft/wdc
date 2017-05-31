## Dynamic Word Cloud

An implementation of a dynamic word cloud generator using D3.

## Usage

The word cloud is embedded in a website by calling 

```
dwc.create(wordSource, colorMin, colorMax, colorNeutral, maxRotationDeg, resizeFactor)
```

with the following parameters:

- **wordSource:** a CSV file with the word size data
- **colorMin:** the color for shrinking words
- **colorMax:** the color for growing words
- **colorNeutral:** the color for words not changing in size
- **maxRotationDeg:** the maximum rotation in degrees
- **resizeFactor:** The resize factor for converting the CSV values to SVG text size


See the example implementation using the given names dataset in /examples/given_names. It uses the following arguments (note the neutral, black color being rgb(1, 1, 1) instead of rgb(0, 0, 0) to avoid a quirk with D3 color interpolation):

```
dwc.create("data/test.csv", "rgb(255, 0, 1)", "rgb(1, 255, 0)", "rgb(1, 1, 1)", 30, 0.5);
```

## Input Data

To generate, use a path to a CSV file: dwc.create("datafile.csv")

The CSV file should be formatted like this:

```
word,2006,2007,2008,2009,2010,2011,2012,2013,2014,font  
David,122,125,119,102,169,162,151,200,167,times  
Maximilian,118,120,120,120,146,183,126,128,148,times  
Sophie,100,102,100,92,109,122,107,130,132,arial  
```

The first column sets the word. The other columns the different points in time using the label of the top row. The last column should indicate a desired font to be used with each word.