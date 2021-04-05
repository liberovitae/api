import models from '../models';
import permalink from 'permalinks';

export const buildComment = async (input, me, postId, parentId) => {
  try {
    const comment = await models.Comment.create({
      ...input,
      postId: postId,
    });
    // // console.log(comment);
    // comment.permalink = permalink(`/${post.type}/:slug/:cslug`, {
    //   // slug: post.slug,
    //   cslug: comment.slug,
    //   // title: post.title
    //   // Strip out special characters, change spaces to dash & convert to lowercase
    //   // .replace(/[`~!@#$%^&*()_|+\=?;:'",.<>\{\}\[\]\\\/]/gi, '')
    //   // .replace(/\s+/g, '-')
    //   // .toLowerCase(),
    // });
    comment.parentId = parentId;
    comment.postId = postId;
    comment.upvote(me.id);
    // comment.score = wilsonScore(
    //   comment.vote.positive.length,
    //   comment.vote.negative.length,
    //   comment.createdAt,
    // );
    comment.points++;
    comment.updatedAt = null;
    comment.save();

    return comment;
  } catch (err) {
    console.error(err);
  }
};
