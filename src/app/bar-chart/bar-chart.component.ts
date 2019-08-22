import { Component, ElementRef, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, OnInit, OnChanges, Input, AfterViewInit, SimpleChanges, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';
import { values } from 'd3';


@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./bar-chart.component.scss']
})


export class BarChartComponent implements AfterViewInit, OnChanges {
  refineData;
  magazine = 0;
  value = 0;
  journalArr: any[];
  @ViewChild('chart', { static: false })
  private chartContainer: ElementRef;
  // @Input() value;
  getMagNum(value) {
    console.log(value);
    this.value = value;
    // console.log(this.magazine);
  }

  constructor(private http: HttpClient, private changeDetector: ChangeDetectorRef) {
    setInterval(() => {
      // this.createChart();
      

      if (this.magazine != this.value) {
        this.magazine = this.value;
        this.draw(this.refineData, this.magazine);
      }
      // require view to be updated
      this.changeDetector.detectChanges();
    }, 5000);
  }

  ngOnDestory() { }

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log("ng on changes run : " + changes);
    this.createChart();
  }



  onResize() {
    this.createChart();
  }

  /************************************************************************
   * 
   * 
   * data mining segment
   * Freq
   * Freq_DF
   * DFify
   * TFify
   * render
   * 
   *  
   ***********************************************************************/
  Freq(list) {
    var TF: { word: string, TF: number }[]
      = new Array<{ word: string, TF: number }>();

    if (list.length > 0) {
      var count = 1;
      for (var j = 0; j <= list.length - 1; j++) {    //다음 index의 단어와 같은지 확인하니까 -1
        if (list[j] === list[j + 1]) {
          count++;
        }
        else {
          TF.push({ word: list[j], TF: count })
          count = 1;
        }
      }

      TF.sort(function (a, b) {
        return +b.TF - +a.TF;
      });

    }
    return TF;
  }

  Freq_DF(list) {
    var word_meta: { docN: number, index: number }[] = [];
    var DF_meta: { word: string, freqD: number, doc: { docN: number, index: number }[] }[] = [];

    if (list.length > 0) {
      var count = 1;
      var distinct = 0;
      for (var j = 0; j < list.length - 1; j++) {    //다음 index의 단어와 같은지 확인하니까 -1

        word_meta.push({ docN: list[j].docNum, index: list[j].index });

        try {
          if (list[j].word === list[j + 1].word) {
            count++;
          }
          else {
            DF_meta.push({ word: null, freqD: null, doc: null });
            DF_meta[distinct].word = list[j].word;
            DF_meta[distinct].freqD = count;
            DF_meta[distinct].doc = word_meta;
            count = 1;

            distinct++;
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

  DFify(listDF) {
    var listSort = listDF.sort(function (a, b) { return d3.ascending(a.word, b.word); });
    return this.Freq_DF(listSort);
  }

  TFify = function (list, arr) {
    var listSort = list.sort(function (a, b) { return d3.ascending(a, b); });//가나다 수로 정렬
    return this.Freq(listSort, arr);
  }




  /***ngFor data binding function
   * 
   * 
   */



  printout(value) {
    console.log(value);
  }



  private render(data) {

    var TF_arr: { word: string, TF: number }[][]
      = new Array<{ word: string, TF: number }[]>();
    var TF_meta: { word: string, docNum: number, index: number }[]
      = new Array<{ word: string, docNum: number, index: number }>();
    var DF_arr: { word: string, freqD: number, doc: { docN: number, index: number }[] }[] = [];
    var TF_IDF: { word: string, TF_IDF: number }[]
      = [{ word: null, TF_IDF: null }];
    var TF_IDF_arr: { word: string, TF_IDF: number }[][]
      = [TF_IDF];

    var wordArr = [];

    // console.log(data);
    var journal = d3.csvParse(data, function (d) {
      return {
        // 키워드: d.키워드,
        언론사: d.언론사
      };
    });
    // console.log(journal);
    this.journalArr = [];
    var lenJ = journal.length;
    for (var i = 0; i < lenJ; i++) {
      this.journalArr[i] = Object.values(journal[i]);//remove column head
      // console.log(dataValues);
    }

    /***
     * 
     * 
     */

    // this.magazine = this.journalArr[0];
    // TF_IDF table
    /**
     * [
     *  { 언론사 : 국민일보, 
     *    freq   : [  
     *                { word : 조국, TF_IDF : 10 },
     *                { word : aaa,  TF_IDF : 5  }
     *                 
     *             ]
     *  },
     *  {
     *  
     *  }
     * ]
     * 
     * 
     */


    //전체 문서에서 해당 column 분리
    var targetColumn = d3.csvParse(data, function (d) {
      return {
        키워드: d.키워드
      };
    });

    //column data의 형식을 가공: 전체 string -> object & array
    var len = targetColumn.length;  //전체 기사의 수, 키워드 column의 index 수
    for (var i = 0; i < len; i++) {
      var dataValues = Object.values(targetColumn[i]);//remove column head
      wordArr = dataValues[0].split(','); //string을 object & array으로 분리
      TF_arr[i] = this.TFify(wordArr, TF_arr);  //TF 테이블에 저장

      var DocWordLen = TF_arr[i].length;  //개별 문서에 몇개의 단어가 있는지 파악

      //DF에 사용하기 위해 개별 단어가 속한 문서 번호와 해당 문서에서의 index 기록
      TF_IDF = [{ word: null, TF_IDF: null }];  //initilization
      for (var k = 0; k < DocWordLen; k++) {

        var word = (TF_arr[i][k].word);
        var idx = k;
        var docN = i;
        TF_meta.push({ word: word, docNum: docN, index: idx }); //DF에 사용하기 위해 새로운 형식으로 저장 

        TF_IDF[k] = { word: word, TF_IDF: null }; //TF_IDF 테이블에 word 저장
      }

      TF_IDF_arr[i] = TF_IDF; //최종 TF_IDF 테이블에 단어 하나 하나씩 initialize

    }//for

    //DF 테이블 저장. 
    DF_arr = this.DFify(TF_meta);

    //TF_IDF 테이블에 tf-idf 값 저장
    for (i = 0; i < DF_arr.length; i++) {

      var IDF = (len / DF_arr[i].freqD);
      var IDF_log = Math.log(IDF) / Math.log(10);

      for (var j = 0; j < DF_arr[i].doc.length; j++) {
        var numI = DF_arr[i].doc[j].index;
        var numD = DF_arr[i].doc[j].docN;
        /**
         * ojbect을 element을 가진 array
         * 다른 함수로 paramenter으로 넣었다. 
         * 그 함수 안에서는 element 의 이름이 다르게 되어있음.
         * 그래도 return 혹은 그냥 call by ref으로 저장.
         * 그러면 어떻게?
         * 
         * TF.freq였다가 TF.TF로 변경
         */
        var tfVal = TF_arr[numD][numI].TF;
        var tf_idf_val = tfVal * IDF_log;

        TF_IDF_arr[numD][numI].TF_IDF = tf_idf_val;
      }

    }

    //TF_IDF 기준으로 정렬
    for (var v = 0; v < TF_IDF_arr.length; v++) {
      TF_IDF_arr[v].sort((a, b) => b.TF_IDF - a.TF_IDF);
    }

    return TF_IDF_arr;
  }//render








  /************************************************************************
   * 
   * 
   * data visualization
   * 
   *  
   ***********************************************************************/

  private draw(data, magazine) {

    //data pull ok? 
    // console.log(data);
    // console.log(data[0][0].word);
    // alert(data[0][0].word);

    const element = this.chartContainer.nativeElement;
    const svg = d3.select(element).select('svg');
    const width = +(element.querySelector('svg').clientWidth);
    const height = +(element.querySelector('svg').clientHeight);

    var color = d3.scaleOrdinal(d3.schemeAccent);

    var simulation = d3.forceSimulation()
      .force("link", d3.forceLink())
      .force("charge", d3.forceManyBody().strength(-1))
      .force("collide", d3.forceCollide().radius(function (d) {
        return d['TF_IDF'] * 5;
      }))
      .force("center", d3.forceCenter(width / 2, height / 2));

    svg.append("rect")
      .attr("stroke", "black")
      .attr("fill", "none")
      .attr("width", width)
      .attr("height", height);


    //node
    /**
       * data
       * [ 
       *  [ doc1 ], 
       *  [ doc2 ], 
       *  [ { word: abc, TF_IDF: 10 },
       *    { word: efg, TF_IDF: 20 }, 
       *      ... 
          ],
          ... 
         ]
       * 
       */
    console.log("draw in draw function")
    console.log(this.magazine);
    var number = +this.magazine;
    // console.log(number);
    console.log(data[number]);

    var node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(data[0])
      .enter().append("g");

    var circles = node.append("circle")
      .attr("r", (d) => d['TF_IDF'] * 5)
      .attr("fill", function (d) { return color(d['group']); })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    var lables = node.append("text")
      .text(function (d) {
        return d['word'];
      })
      .attr("font-size", 10)
      .attr('x', function (d) {
        var w = d['word'];
        return -w.length * 5;
      })
      .attr('y', 0);

    node.append("title")
      .text(function (d) { return d['word']; });

    simulation
      .nodes(data[0])
      .on("tick", ticked);

    // // simulation.force("link").links(dataLink);
    // simulation.force("links", d3.forceLink().links(dataLink)
    //   .id(function (d) { /*console.log(d['id']);*/return d['id']; }))
    //   ;
    // // .force("link").links(dataLink);
    // // .force("link", d3.forceLink(dataLink));
    // // simulation.force("link").links(graph.links);

    function ticked() {
      // link
      //   .attr("x1", function (d) { return d['source.x']; })
      //   .attr("y1", function (d) { return d['source.y']; })
      //   .attr("x2", function (d) { return d['target.x']; })
      //   .attr("y2", function (d) { return d['target.y']; })
      // .attr("stroke","black")
      // .attr("stroke-width", function (d) { /*console.log(d['value']);*/return Math.sqrt(d['value']); });

      node
        .attr("transform", function (d) {
          return "translate(" + d['x'] + "," + d['y'] + ")";
        })
    }

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }//func

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }//func

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }//func
  }




  //createChart
  private createChart(): void {
    console.log("Create!");
    this.http.get('assets/dataset.csv', { responseType: 'text' })
      .subscribe(
        data => {
          this.refineData = this.render(data);//data을 받을 때 형변환이 필요 없다...? 
          // console.log(refineData);
          this.draw(this.refineData, this.magazine);
        },
        error => {
          console.log(error);
        }
      );
  }//createChart
}
