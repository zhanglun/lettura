/* eslint-disable class-methods-use-this */
import { makeAutoObservable } from 'mobx';
import { getCustomRepository } from 'typeorm';
import { Article } from '../../infra/types';
// import { ChannelEntity } from '../../entity/channel';
import { ArticleEntity } from '../../entity/article';
import { ArticleRepository } from '../../repository/article';

export class ArticleStore {
  currentArticle: ArticleEntity = {} as ArticleEntity;

  articleList: ArticleEntity[] = [];

  articleRepo = {} as ArticleRepository;

  constructor() {
    makeAutoObservable(this);

    this.articleRepo = getCustomRepository(ArticleRepository);
  }

  setCurrentArticle(article: ArticleEntity) {
    this.currentArticle = article;
  }

  async getAllList(): Promise<Article[]> {
    const list = await this.articleRepo.getAll();

    return list;
  }

  async getListWithChannelId(channelId: string): Promise<Article[]> {
    const list = await this.articleRepo.getListWithChannelId(channelId);

    return list;
  }

  setCurrentView(article: ArticleEntity): void {
    this.currentArticle = article;
  }
}
