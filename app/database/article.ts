import { Article } from '../infra/types';

export class ArticleModel {
  // eslint-disable-next-line class-methods-use-this
  update(data: Article) {
    console.log(data);
  }
}
