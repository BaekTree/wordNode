import { OnInit, Component, ElementRef, Input, OnChanges, ViewChild, ViewEncapsulation, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';
import { DataModel } from 'src/app/data/data.news';
import { listFreq } from './model/listFreq'
import { TF_meta } from './model/TF_meta'

@Component({
  selector: 'app-bar-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
// class 

export class BarChartComponent implements OnInit {

  @ViewChild('chart', { static: false })
  private chartContainer: ElementRef;

  @Input()
  margin = { top: 20, right: 20, bottom: 30, left: 40 };

  constructor(private http: HttpClient) { }
  ngOnInit() {
    this.createChart();
  }

  onResize() {
    this.createChart();
  }

  //data mining

  Freq(list, result) {
    var TF: { word: string, freq: number }[]
      = new Array<{ word: string, freq: number }>();

    if (list.length > 0) {
      var count = 1;
      var freqArr = [];
      for (var j = 0; j <= list.length - 1; j++) {    //다음 index의 단어와 같은지 확인하니까 -1
        if (list[j] === list[j + 1]) {
          count++;
        }
        else {
          TF.push({ word: list[j], freq: count })
          count = 1;
        }
      }

      TF.sort(function (a, b) {
        return +b.freq - +a.freq;
      });

    }
    return TF;
  }

  Freq_DF(list) {
    var word_meta: { docN: number, index: number }[] = [];
    var DF_meta: { word: string, freqD: number, doc: { docN: number, index: number }[] }[] = [];

    if (list.length > 0) {
      var count = 1;

      for (var j = 0; j < list.length - 1; j++) {    //다음 index의 단어와 같은지 확인하니까 -1
        DF_meta.push({ word: null, freqD: null, doc: null });

        try {
          if (list[j].word === list[j + 1].word) {
            count++;
            word_meta.push({ docN: list[j].docNum, index: list[j].index });

          }
          else {
            DF_meta[j].word = list[j].word;
            DF_meta[j].freqD = count;
            DF_meta[j].doc = word_meta;
            count = 1;
            word_meta = [];
          }
        } catch (err) {
          console.log("Error " + j);
          console.log(err.message);
        }
      }

      DF_meta.sort(function (a, b) {
        return +b.freqD - +a.freqD;
      });
      return DF_meta;
    }
  }

  DFify(listDF, arr) {
    var listSort = listDF.sort(function (a, b) { return d3.ascending(a.word, b.word); });
    return this.Freq_DF(listSort);
  }

  TFify = function (list, arr) {
    var listSort = list.sort(function (a, b) { return d3.ascending(a, b); });//가나다 수로 정렬
    return this.Freq(listSort, arr);
  }




  private render(data) {

    var TF_arr: { word: string, TF: number }[][]
      = new Array<{ word: string, TF: number }[]>();

    var TF_meta: { word: string, docNum: number, index: number }[]
      = new Array<{ word: string, docNum: number, index: number }>();

    var DF_arr: { word: string, freqD: number, doc: { docN: number, index: number }[] }[] = [];




    var TF_IDF_arr: { word: string, TF_IDF: number }[][] = [];
    

    var listDF = [];

    var wordArr = [];

    var targetColumn = d3.csvParse(data, function (d) {
      return {
        키워드: d.키워드
      };
    });


    var len = targetColumn.length;  //전체 기사의 수, 키워드 column의 index 수
    for (var i = 0; i < len; i++) {
      var dataValues = Object.values(targetColumn[i]);//remove column head
      wordArr = dataValues[0].split(',');
      TF_arr[i] = this.TFify(wordArr, TF_arr);



      // console.log(TF_arr);
      var DocWordLen = TF_arr[i].length;
      for (var k = 0; k < DocWordLen; k++) {

        var word = (TF_arr[i][k].word);
        var idx = k;
        var docN = i;
        TF_meta.push({ word: word, docNum: docN, index: idx });
      }

    }//for

    DF_arr = this.DFify(TF_meta, DF_arr);
    console.log(DF_arr)




    for (i = 0; i < DF_arr.length; i++) {
      var IDF = (len / DF_arr[i].freqD);
     
    }

    return data;
  }//render

  private draw(data) {
    var svg = d3.select("svg")
      .attr('width', 500)
      .attr('height', 500);
    var width = 500;
    var height = 500;

    var color = d3.scaleOrdinal(d3.schemeAccent);

    var simulation = d3.forceSimulation()
      .force("link", d3.forceLink())
      .force("charge", d3.forceManyBody())
      .force("collide", d3.forceCollide(20))
      .force("center", d3.forceCenter(width / 2, height / 2));
    // .force("locationX", d3.forceX().x(2000))
    // .force("locationY", d3.forceY().y(2000));

  }

  //visualization

  private createChart(): void {
    // const svg = d3.select(element).append('svg')
    //   .attr('width', element.offsetWidth)
    //   .attr('height', element.offsetHeight * 3);
    // var svg = d3.select("svg")
    //   .attr('width', 500)
    //   .attr('height', 500);
    // var width = 500;
    // var height = 500; 
    // var width = +element.offsetWidth;
    // var height = +element.offsetHeight
    // //   const contentWidth = element.offsetWidth - this.margin.left - this.margin.right;
    // //   const contentHeight = element.offsetHeight - this.margin.top - this.margin.bottom;


    this.http.get('assets/dataset.csv', { responseType: 'text' })
      .subscribe(
        data => {
          data = this.render(data);
          // console.log(data);
          // print(data);
        },
        error => {
          console.log(error);
        }
      );
    // console.log(this.data);

    // d3.select('svg').remove();

    // const element = this.chartContainer.nativeElement;
    // //   const data = this.data;

    // var svg = d3.select("svg")
    //   .attr('width', 500)
    //   .attr('height', 500);
    // var width = 500;
    // var height = 500;

    // var color = d3.scaleOrdinal(d3.schemeAccent);

    // var simulation = d3.forceSimulation()
    //   .force("link", d3.forceLink())
    //   // .force("charge", d3.forceManyBody())
    //   .force("collide", d3.forceCollide(20))

    //   .force("center", d3.forceCenter(width / 2, height / 2));
    // // .force("locationX", d3.forceX().x(2000))
    // // .force("locationY", d3.forceY().y(2000));

    // // d3.json("miserable.json", function (error, graph) {
    // // if (error) throw error;

    // ////////////////////////////////////////////////////////////////

    // // var Freq = function (list, result) {
    // //   if (list.length > 0) {
    // //     // console.log("list.lengh : " + list.length);
    // //     var count = 1;
    // //     var freqArr = [];

    // //     for (var j = 0; j <= list.length - 1; j++) {    //다음 index의 단어와 같은지 확인하니까 -1
    // //       if (list[j] === list[j + 1]) {
    // //         count++;
    // //       }
    // //       else {
    // //         this.listFreq_.name = list[j];
    // //         this.listFreq_.count = count;
    // //         freqArr.push(this.listFreq_);
    // //         count = 1;
    // //       }
    // //     }
    // //     freqArr.sort(function (a, b) {
    // //       return +b.count - +a.count;
    // //     });
    // //     result.push(freqArr);
    // //   }
    // // }

    // // var Freq_DF = function (list, result) {
    // //   // console.log(list);
    // //   if (list.length > 0) {
    // //     // console.log("list.lengh : " + list.length);
    // //     var count = 1;
    // //     var freqArr = [];
    // //     var doc_temp = [];

    // //     for (var j = 0; j < list.length - 1; j++) {    //다음 index의 단어와 같은지 확인하니까 -1
    // //       // console.log(list[j]);
    // //       try {
    // //         if (list[j].name === list[j + 1].name) {
    // //           count++;
    // //           doc_temp.push({ "doc": list[j].doc, "idx": list[j].idx });
    // //         }
    // //         else {
    // //           // var listFreq = {
    // //           //   name: String,
    // //           //   count: Number,
    // //           //   doc: []
    // //           // };
    // //           this.listFreq_.name = list[j].name;
    // //           this.listFreq_.count = count;
    // //           doc_temp.push({ "doc": list[j].doc, "idx": list[j].idx });
    // //           this.listFreq_.doc = doc_temp;

    // //           freqArr.push(this.listFreq_);
    // //           count = 1;
    // //           doc_temp = [];
    // //         }
    // //       } catch{
    // //         console.log("Error " + j);
    // //         console.log(list[j]);
    // //       }
    // //     }
    // //     // console.log(freqArr);
    // //     freqArr.sort(function (a, b) {
    // //       return +b.count - +a.count;
    // //     });
    // //     result.push(freqArr);
    // //   }
    // // }

    // // var DFify = function (listDF, arr) {
    // //   var listSort = listDF.sort(function (a, b) { return d3.ascending(a.name, b.name); });
    // //   // console.log(listSort);
    // //   Freq_DF(listSort, arr);
    // // }

    // // var TFify = function (list, arr) {
    // //   var listSort = list.sort(function (a, b) { return d3.ascending(a, b); });//가나다 수로 정렬
    // //   Freq(listSort, arr);
    // // }

    // // // d3.csv('https://baektree.github.io/d3/bigkinds_utf.csv').then(data => { //data load

    // //   var TF_arr = [];
    // //   var DF_arr = [];
    // //   var listDF = [];

    // //   var wordArr = [];
    // //   wordArr = data.map(d => d['키워드'])//키워드 column분리
    // //   var len = wordArr.length;  //전체 기사의 수, 키워드 column의 index 수

    // //   var TF_meta = [];

    // //   // var find = 0;
    // //   for (var i = 0; i < len; i++) {
    // //     var list = [];
    // //     list = d3.csvParseRows(wordArr[i]);    //데이터의 형식을 변환
    // //     list = list[0];                         //array의 element가 큰 덩어리로 하나

    // //     TFify(list, TF_arr);

    // //     var DocWordLen = TF_arr[i].length;
    // //     for (var k = 0; k < DocWordLen; k++) {

    // //       this.TF_meta_obj.name = (TF_arr[i][k].name);
    // //       this.TF_meta_obj.idx = k;
    // //       this.TF_meta_obj.doc = i;
    // //       TF_meta.push(this.TF_meta_obj);
    // //     }

    // //     //before df inhencement
    // //     DocWordLen = TF_arr[i].length;
    // //     for (k = 0; k < DocWordLen; k++) {
    // //       listDF = listDF.concat(TF_arr[i][k].name);
    // //     }
    // //   }

    // //   DFify(TF_meta, DF_arr);



    // //   for (i = 0; i < DF_arr[0].length; i++) {
    // //     var IDF = (len / DF_arr[0][i].count);
    // //     DF_arr[0][i].IDF_log = Math.log(IDF) / Math.LN10;
    // //   }

    // //   for (var i = 0; i < DF_arr[0].length; i++) {
    // //     for (var j = 0; j < DF_arr[0][i].doc.length; j++) {
    // //       var numD = DF_arr[0][i].doc[j].doc;
    // //       var numI = DF_arr[0][i].doc[j].idx;

    // //       TF_arr[numD][numI].idf = DF_arr[0][i].IDF_log;
    // //       TF_arr[numD][numI].tf_idf = TF_arr[numD][numI].count * TF_arr[numD][numI].idf;
    // //     }
    // //   }

    // //   for (i = 0; i < TF_arr.length; i++) {
    // //     TF_arr[i].sort((a, b) => b.tf_idf - a.tf_idf);
    // //   }
    // //   console.log(TF_arr);
    // //   this.data = TF_arr;

    // // // });

    // var graph = this.data;

    // ////////////////////////////////////////////////////////////////
    // var dataNode = graph['nodes'];;
    // var dataLink = graph['links'];
    // // console.log(graph);
    // // console.log(dataLink);
    // // console.log(dataNode);

    // var link = svg.append("g")
    //   .attr("class", "links")
    //   .selectAll("path")
    //   .data(dataLink)
    //   .enter().append("path")
    //   .attr("stroke", "black")
    //   // .attr("style", "stroke: #ff0000; stroke-opacity: 0.6;")
    //   // .attr("transform", "translate(0,0)")
    //   // .attr("stroke", (d)=> { return "#D3D3D3"; })
    //   .attr("stroke-width", 10)
    //   .attr('stroke', 'black');// add this line
    // // function (d) { /*console.log(d['value']);*/return Math.sqrt(d['value']); });

    // var node = svg.append("g")
    //   .attr("class", "nodes")
    //   .selectAll("g")
    //   .data(dataNode)
    //   .enter().append("g");

    // var circles = node.append("circle")
    //   .attr("r", 5)
    //   .attr("fill", function (d) { return color(d['group']); })
    //   .call(d3.drag()
    //     .on("start", dragstarted)
    //     .on("drag", dragged)
    //     .on("end", dragended));

    // var lables = node.append("text")
    //   .text(function (d) {
    //     return d['id'];
    //   })
    //   .attr('x', 6)
    //   .attr('y', 3);

    // node.append("title")
    //   .text(function (d) { return d['id']; });

    // simulation
    //   .nodes(dataNode)
    //   // .on("tick", () => ticked(dataNode, dataLink));
    //   .on("tick", ticked);

    // // simulation.force("link").links(dataLink);
    // simulation.force("links", d3.forceLink().links(dataLink)
    //   .id(function (d) { /*console.log(d['id']);*/return d['id']; }))
    //   ;
    // // .force("link").links(dataLink);
    // // .force("link", d3.forceLink(dataLink));
    // // simulation.force("link").links(graph.links);

    // function ticked() {
    //   link
    //     .attr("x1", function (d) { return d['source.x']; })
    //     .attr("y1", function (d) { return d['source.y']; })
    //     .attr("x2", function (d) { return d['target.x']; })
    //     .attr("y2", function (d) { return d['target.y']; })
    //     // .attr("stroke","black")
    //     // .attr("stroke-width", function (d) { /*console.log(d['value']);*/return Math.sqrt(d['value']); });
    //     ;

    //   node
    //     .attr("transform", function (d) {
    //       return "translate(" + d['x'] + "," + d['y'] + ")";
    //     })
    // }
    // // });

    // function dragstarted(d) {
    //   if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    //   d.fx = d.x;
    //   d.fy = d.y;
    // }

    // function dragged(d) {
    //   d.fx = d3.event.x;
    //   d.fy = d3.event.y;
    // }

    // function dragended(d) {
    //   if (!d3.event.active) simulation.alphaTarget(0);
    //   d.fx = null;
    //   d.fy = null;
    // }
    // // simulation.alpha(1).restart();
    // //till here



    // //   const x = d3
    // //     .scaleBand()
    // //     .rangeRound([0, contentWidth])
    // //     .padding(0.1)
    // //     .domain(data.map(d => d.letter));

    // //   const y = d3
    // //     .scaleLinear()
    // //     .rangeRound([contentHeight, 0])
    // //     .domain([0, d3.max(data, d => d.frequency)]);

    // //   const g = svg.append('g')
    // //     .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    // //   g.append('g')
    // //     .attr('class', 'axis axis--x')
    // //     .attr('transform', 'translate(0,' + contentHeight + ')')
    // //     .call(d3.axisBottom(x));

    // //   g.append('g')
    // //     .attr('class', 'axis axis--y')
    // //     .call(d3.axisLeft(y).ticks(10, '%'))
    // //     .append('text')
    // //       .attr('transform', 'rotate(-90)')
    // //       .attr('y', 6)
    // //       .attr('dy', '0.71em')
    // //       .attr('text-anchor', 'end')
    // //       .text('Frequency');

    // //   g.selectAll('.bar')
    // //     .data(data)
    // //     .enter().append('rect')
    // //       .attr('class', 'bar')
    // //       .attr('x', d => x(d.letter))
    // //       .attr('y', d => y(d.frequency))
    // //       .attr('width', x.bandwidth())
    // //       .attr('height', d => contentHeight - y(d.frequency));
  }
}
