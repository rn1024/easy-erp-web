import axios from './index';
import type { ResType } from '@/types/api';

// 财务报表数据类型
export interface FinancialReport {
  id: string;
  shopId: string;
  reportMonth: string;
  details: FinancialReportDetails;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    nickname: string;
    responsiblePerson: string;
  };
}

// 财务报表详细数据结构
export interface FinancialReportDetails {
  revenue?: {
    totalRevenue: number;
    productSales: number;
    serviceFees: number;
    otherIncome: number;
  };
  costs?: {
    totalCosts: number;
    productCosts: number;
    shippingCosts: number;
    marketingCosts: number;
    operatingCosts: number;
    otherCosts: number;
  };
  profit?: {
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
  };
  inventory?: {
    startingInventory: number;
    endingInventory: number;
    inventoryTurnover: number;
  };
  sales?: {
    totalOrders: number;
    averageOrderValue: number;
    returnRate: number;
    conversionRate: number;
  };
  advertising?: {
    adSpend: number;
    adRevenue: number;
    acos: number; // Advertising Cost of Sales
    roas: number; // Return on Ad Spend
  };
  cashFlow?: {
    operatingCashFlow: number;
    investmentCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
  };
}

// 查询参数
export interface FinancialReportQueryParams {
  page?: number;
  pageSize?: number;
  shopId?: string;
  reportMonth?: string;
}

// 创建财务报表参数
export interface CreateFinancialReportData {
  shopId: string;
  reportMonth: string;
  details?: FinancialReportDetails;
}

// 更新财务报表参数
export interface UpdateFinancialReportData {
  reportMonth?: string;
  details?: FinancialReportDetails;
}

// 获取财务报表列表
export const getFinancialReportsApi = (params: FinancialReportQueryParams) => {
  return axios<
    ResType<{
      list: FinancialReport[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>
  >('/financial-reports', {
    method: 'get',
    params,
  });
};

// 获取财务报表详情
export const getFinancialReportApi = (id: string) => {
  return axios<ResType<FinancialReport>>(`/financial-reports/${id}`, {
    method: 'get',
  });
};

// 创建财务报表
export const createFinancialReportApi = (data: CreateFinancialReportData) => {
  return axios<ResType<FinancialReport>>('/financial-reports', {
    method: 'post',
    data,
  });
};

// 更新财务报表
export const updateFinancialReportApi = (id: string, data: UpdateFinancialReportData) => {
  return axios<ResType<FinancialReport>>(`/financial-reports/${id}`, {
    method: 'put',
    data,
  });
};

// 删除财务报表
export const deleteFinancialReportApi = (id: string) => {
  return axios<ResType<null>>(`/financial-reports/${id}`, {
    method: 'delete',
  });
};

// 默认财务报表数据模板
export const getDefaultFinancialReportDetails = (): FinancialReportDetails => ({
  revenue: {
    totalRevenue: 0,
    productSales: 0,
    serviceFees: 0,
    otherIncome: 0,
  },
  costs: {
    totalCosts: 0,
    productCosts: 0,
    shippingCosts: 0,
    marketingCosts: 0,
    operatingCosts: 0,
    otherCosts: 0,
  },
  profit: {
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
  },
  inventory: {
    startingInventory: 0,
    endingInventory: 0,
    inventoryTurnover: 0,
  },
  sales: {
    totalOrders: 0,
    averageOrderValue: 0,
    returnRate: 0,
    conversionRate: 0,
  },
  advertising: {
    adSpend: 0,
    adRevenue: 0,
    acos: 0,
    roas: 0,
  },
  cashFlow: {
    operatingCashFlow: 0,
    investmentCashFlow: 0,
    financingCashFlow: 0,
    netCashFlow: 0,
  },
});

// 计算财务指标
export const calculateFinancialMetrics = (
  details: FinancialReportDetails
): FinancialReportDetails => {
  const updatedDetails = { ...details };

  // 自动计算收入总计
  if (updatedDetails.revenue) {
    const { productSales = 0, serviceFees = 0, otherIncome = 0 } = updatedDetails.revenue;
    updatedDetails.revenue.totalRevenue = productSales + serviceFees + otherIncome;
  }

  // 自动计算成本总计
  if (updatedDetails.costs) {
    const {
      productCosts = 0,
      shippingCosts = 0,
      marketingCosts = 0,
      operatingCosts = 0,
      otherCosts = 0,
    } = updatedDetails.costs;
    updatedDetails.costs.totalCosts =
      productCosts + shippingCosts + marketingCosts + operatingCosts + otherCosts;
  }

  // 自动计算利润指标
  if (updatedDetails.revenue && updatedDetails.costs && updatedDetails.profit) {
    const totalRevenue = updatedDetails.revenue.totalRevenue || 0;
    const totalCosts = updatedDetails.costs.totalCosts || 0;
    const productCosts = updatedDetails.costs.productCosts || 0;

    updatedDetails.profit.grossProfit = totalRevenue - productCosts;
    updatedDetails.profit.netProfit = totalRevenue - totalCosts;
    updatedDetails.profit.profitMargin =
      totalRevenue > 0 ? (updatedDetails.profit.netProfit / totalRevenue) * 100 : 0;
  }

  // 自动计算广告指标
  if (updatedDetails.advertising) {
    const { adSpend = 0, adRevenue = 0 } = updatedDetails.advertising;
    updatedDetails.advertising.acos = adRevenue > 0 ? (adSpend / adRevenue) * 100 : 0;
    updatedDetails.advertising.roas = adSpend > 0 ? adRevenue / adSpend : 0;
  }

  // 自动计算现金流净额
  if (updatedDetails.cashFlow) {
    const {
      operatingCashFlow = 0,
      investmentCashFlow = 0,
      financingCashFlow = 0,
    } = updatedDetails.cashFlow;
    updatedDetails.cashFlow.netCashFlow =
      operatingCashFlow + investmentCashFlow + financingCashFlow;
  }

  return updatedDetails;
};

// 格式化金额显示
export const formatCurrency = (amount: number, currency: string = '¥'): string => {
  return `${currency}${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// 格式化百分比显示
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// 月份选项
export const getMonthOptions = () => {
  const currentYear = new Date().getFullYear();
  const options = [];

  for (let year = currentYear - 2; year <= currentYear + 1; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      options.push({
        value: `${year}-${monthStr}`,
        label: `${year}年${month}月`,
      });
    }
  }

  return options.reverse(); // 最新月份在前
};
