import { Injectable } from '@angular/core';
import { AgentService } from './agent.service';
import { Method } from './contract';
import { Statement, Collection, Page } from './statement';

@Injectable({
  providedIn: 'root'
})
export class DelibService {

  server:string = '';
  agent:string = '';
  contract:string = '';
  sid:string | null = null;
  parent:Statement | null = null;
  kids:Collection = {} as Collection;
  aggregateOrder:string[][] = [];

  constructor(
    private agentService: AgentService
  ) { }

  getPage() {
    let method = { name: 'get_statements', values: {'parent': this.sid}} as Method;
    this.agentService.read(this.server, this.agent, this.contract, method)
      .subscribe((page:Page) => {
        if(page.parent && this.sid && this.sid in page.parent) {
          this.parent = page.parent[this.sid];
        }
        else {
          this.parent = null;
        }
        this.kids = page.kids;
        this.setAggregatedOrder();
      });
    }

  setScope(server: string, agent: string, contract: string) {
    this.server = server;
    this.agent = agent;
    this.contract = contract;
  }

  createStatement(statement: string): void {
    console.log(this.sid, statement);
    const method = { name: 'create_statement',
                     values: {'parent': this.sid, 'text': statement}} as Method;
    this.agentService.write(this.server, this.agent, this.contract, method)
      .subscribe();
  }

  setRanking(sid: string, order: string[][]) {
    const method = { name: 'set_ranking',
                     values: {'sid': sid, 'order': order}} as Method;
    this.agentService.write(this.server, this.agent, this.contract, method).subscribe();
  }

  deleteStatement(): void {
    console.log('delete', this.sid);
    const method = { name: 'delete_statement',
                     values: {'sid': this.sid}} as Method;
    this.agentService.write(this.server, this.agent, this.contract, method)
      .subscribe();
  }

  async setAggregatedOrder() {
    if(!this.parent || Object.keys(this.parent['ranking_kids']).length == 0) {
      this.aggregateOrder = [Object.keys(this.kids)];
    } else {
      this.aggregateOrder = [];
      let ranking = this.parent['ranking_kids'];
      let kids = [...this.parent.kids, 'support', 'oppose'];
      let n = kids.length;
      let indexes: {[keys: string]: number} = {};
      let sum_matrix: number[][] = [];
      kids.forEach((value, index) => {
        indexes[value] = index;
        sum_matrix.push(new Array(n).fill(0));
      });

      // pairwise compare matrix
      for (let order of Object.values(ranking)) {
        let unordered = new Set(Object.keys(indexes));
        for (let above of order[0]) {
          if (unordered.has(above)) {
            unordered.delete(above);
            let above_index = indexes[above];
            for (let below of unordered) {
              let below_index = indexes[below];
              sum_matrix[above_index][below_index] += 1;
            }
          }
        }
        let above = 'support';
        unordered.delete(above);
        let above_index = indexes[above];
        for (let below of unordered) {
          let below_index = indexes[below];
          sum_matrix[above_index][below_index] += 1;
        }
        for (let below of order[1].slice().reverse()) {
          if (unordered.has(below)) {
            unordered.delete(below);
            let below_index = indexes[below];
            for (let above of unordered) {
              let above_index = indexes[above];
              sum_matrix[above_index][below_index] += 1;
            }
          }
        }
        let below = 'oppose';
        unordered.delete(below);
        let below_index = indexes[below];
        for (let above of unordered) {
          let above_index = indexes[above];
          sum_matrix[above_index][below_index] += 1;
        }
      }

      // copeland score
      let copeland: number[] = [];
      for (let row = 0; row < n; ++row) {
        for (let col = row+1; col < n; ++col) {
          sum_matrix[row][col] = (sum_matrix[row][col] > sum_matrix[col][row]) ? 2 :
                                  ((sum_matrix[row][col] == sum_matrix[col][row]) ? 1 : 0);
          sum_matrix[col][row] = 2-sum_matrix[row][col];
        }
        copeland.push(sum_matrix[row].reduce((a,b) => a+b));
      }
      let order = Array.from(Array(n).keys());
      order.sort((a,b) => copeland[b]-copeland[a]);

      // smith sets
      let smith_sets = [];
      let row,col,lhs,rhs,prev: number;
      // loop on all sets
      for(rhs=1,lhs=0,prev=0;lhs<n;rhs=lhs+1) {
        // loop on a single set
        for(;lhs<rhs;lhs=rhs,rhs=row+1) {
          // include candidates with the same copeland score
          for(;rhs<n&&copeland[order[rhs]]==copeland[order[rhs-1]];rhs++);
          // loop on rows and cols to find all zeros
          for(col=rhs,row=n;col==rhs&&row>=rhs;row--) {
            for(col=lhs;col<rhs&&sum_matrix[order[row-1]][order[col]]==0;col++);
          }
        }
        smith_sets.push(Array.from({length: (lhs - prev)}, (v, k) => kids[order[k + prev]]));
        prev = lhs;
      }

      this.aggregateOrder = smith_sets;
      console.log(this.aggregateOrder);
    }
  }
}
