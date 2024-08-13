import { promises as fs } from 'fs';
import type { Context } from 'koa';
import { Joi } from 'koa-joi-router';
import path from 'path';

import db from '../models';

export const photoController = {
  read: async (ctx: Context) => {
    const photos = await db.Photo.findAll({
      include: [db.photoExif, db.photoThumbnails],
      order: [['shotTime', 'DESC']],
    });
    ctx.body = photos;
  },

  delete: async (ctx: Context) => {
    const { ids } = ctx.request.body as { ids: number[] };
    const photo = await db.Photo.destroy({ where: { id: ids } });
    ctx.body = photo;
  },

  readThumbnails: async (ctx: Context) => {
    const { id } = ctx.params;
    const { variant } = ctx.query;

    const thumbnail = await db.Thumbnail.findOne({
      where: { photoId: id, variant },
    });

    if (!thumbnail) {
      throw new Error('Thumbnail not exists');
    }

    const imagePath = path.join(
      '/Users/arthur/coding/moments-in-time/photos/thumbnails',
      thumbnail.filePath
    );

    await fs.access(imagePath, fs.constants.F_OK);
    const data = await fs.readFile(imagePath);
    ctx.type = `image/${thumbnail.format}`;
    ctx.body = data;
  },
};

export const photoValidator = {
  read: {},
  delete: {
    type: 'json',
    body: {
      ids: Joi.array().items(Joi.number().integer().min(0)).min(1).required(),
    },
  },
  readThumbnails: {
    params: {
      id: Joi.number().integer().min(0).required(),
    },
    query: {
      // TODO(arthur): variant's value enum
      variant: Joi.required(),
    },
  },
};
