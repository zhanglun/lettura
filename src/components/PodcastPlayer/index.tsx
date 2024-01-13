import { list } from "./data";

function createThumbnail(thumbnails: any) {
  const first = thumbnails[0];
  const uri = first && first.image && first.image.uri ? first.image.uri : "";

  return (
    <div className="w-24 h-24 bg-muted rounded-2xl overflow-hidden">{uri && <img src={uri} className="max-w-[6rem] max-h-[6rem]" />}</div>
  );
}

export const PodcastPlayer = () => {
  function renderList() {
    return list
      .map((_) => {
        let media = [];

        try {
          media = JSON.parse(_.media_object);
        } catch (e) {
          media = [];
        }

        _.media = media[0];
        return _;
      })
      .map((_) => {
        const { description, content, thumbnails = [] } = _.media;

        console.log(thumbnails);

        return (
          <li className="flex gap-3">
            <div>{createThumbnail(thumbnails)}</div>
            <div>
              <p className="">{_.title}</p>
              <p className="mb-2 text-xs text-muted-foreground">这里是feed名称</p>
              <p className="text-xs line-clamp-2 text-muted-foreground">
                {(description || _.description).replace(/(<([^>]+)>)/gi, "")}
              </p>
            </div>
          </li>
        );
      });
  }

  return (
    <div>
      <div>{renderList()}</div>
    </div>
  );
};
