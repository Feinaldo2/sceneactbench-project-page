import { withBase } from './assetPath';

export const links = {
  paper: withBase('sceneactbench.pdf'),
  code: 'https://github.com/harnessRL/3D_Bench',
  dataset: 'https://huggingface.co/datasets/harnessRL/3D_Bench_Datasets',
};

export const authors = [
  { name: 'Yifei Zhao', affiliations: [1, 2], equal: true },
  { name: 'Xiangxin Zhou', affiliations: [1], equal: true, corresponding: true },
  { name: 'Wenhao Yang', affiliations: [1, 3], equal: true },
  { name: 'Jiaqi Tang', affiliations: [1, 4], equal: true },
  { name: 'Pu Jian', affiliations: [1], equal: true },
  { name: 'Huanjin Yao', affiliations: [1, 4], equal: true },
  { name: 'Jiarui Yao', affiliations: [1, 5], equal: true },
  { name: 'Haowei Lin', affiliations: [1, 6] },
  { name: 'Zhuo Chen', affiliations: [1] },
  { name: 'Wenkai Lyu', affiliations: [1] },
  { name: 'Jianzhu Ma', affiliations: [2] },
  { name: 'Xueqian Wang', affiliations: [2] },
  { name: 'Wenxi Zhu', affiliations: [1] },
  { name: 'Tianyu Pang', affiliations: [1], corresponding: true },
] as const;

export const affiliations = [
  { id: 1, name: 'Tencent Hunyuan' },
  { id: 2, name: 'Tsinghua University (THU)' },
  { id: 3, name: 'Nanjing University (NJU)' },
  { id: 4, name: 'Hong Kong University of Science and Technology (HKUST)' },
  { id: 5, name: 'University of Illinois Urbana-Champaign (UIUC)' },
  { id: 6, name: 'Peking University (PKU)' },
] as const;

export const bibtex = `@misc{sceneactbench2026,
  title  = {SceneActBench: Can Agents Act on the 3D Scenes They See?},
  author = {Zhao, Yifei and Zhou, Xiangxin and Yang, Wenhao and Tang, Jiaqi and Jian, Pu and Yao, Huanjin and Yao, Jiarui and Lin, Haowei and Chen, Zhuo and Lyu, Wenkai and Ma, Jianzhu and Wang, Xueqian and Zhu, Wenxi and Pang, Tianyu},
  year   = {2026},
  note   = {Preprint},
  url    = {https://feinaldo2.github.io/sceneactbench-project-page/}
}`;
