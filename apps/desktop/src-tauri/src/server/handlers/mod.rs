pub mod article;
pub mod collection;
pub mod common;
pub mod feed;
pub mod folder;
pub mod tag;

pub fn config(cfg: &mut actix_web::web::ServiceConfig) {
  article::config(cfg);
  collection::config(cfg);
  common::config(cfg);
  feed::config(cfg);
  folder::config(cfg);
  tag::config(cfg);
}
