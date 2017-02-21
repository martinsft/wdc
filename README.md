## Dynamic Word Cloud

An implementation of a dynamic word cloud generator using D3.

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