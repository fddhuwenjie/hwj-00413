import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText,
  Check,
  Loader2,
  Clock,
  User,
  Package,
  Calendar,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import { agreementService } from '@/services/agreement';
import { exchangeService } from '@/services/exchange';
import { itemService } from '@/services/item';
import { userService } from '@/services/user';
import { LOGISTICS_STATUS_COLORS } from '@/utils/constants';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { ExchangeAgreement, Exchange, Item, User as UserType } from '@/types';

export default function ExchangeAgreement() {
  const { exchangeId } = useParams<{ exchangeId: string }>();
  const { currentUser } = useAuthStore();

  const [agreement, setAgreement] = useState<ExchangeAgreement | null>(null);
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [initiatorItem, setInitiatorItem] = useState<Item | null>(null);
  const [responderItem, setResponderItem] = useState<Item | null>(null);
  const [initiator, setInitiator] = useState<UserType | null>(null);
  const [responder, setResponder] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signLoading, setSignLoading] = useState(false);

  useEffect(() => {
    if (!exchangeId) return;
    fetchAgreementData(Number(exchangeId));
  }, [exchangeId]);

  const fetchAgreementData = async (id: number) => {
    setIsLoading(true);
    try {
      const [agreementData, exchangeData] = await Promise.all([
        agreementService.createOrGetAgreement(id),
        exchangeService.getExchangeById(id),
      ]);

      setAgreement(agreementData);
      setExchange(exchangeData);

      if (exchangeData) {
        const [initItem, respItem, initUser, respUser] = await Promise.all([
          itemService.getItemById(exchangeData.itemId),
          exchangeData.targetItemId ? itemService.getItemById(exchangeData.targetItemId) : null,
          userService.getUserById(exchangeData.initiatorId),
          userService.getUserById(exchangeData.responderId),
        ]);
        setInitiatorItem(initItem);
        setResponderItem(respItem);
        setInitiator(initUser);
        setResponder(respUser);
      }
    } catch (error) {
      console.error('Failed to fetch agreement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    if (!agreement || !currentUser) return;
    setSignLoading(true);
    try {
      const updated = await agreementService.signAgreement(agreement.id, currentUser.id);
      if (updated) {
        setAgreement(updated);
      }
    } catch (error) {
      console.error('Failed to sign agreement:', error);
    } finally {
      setSignLoading(false);
    }
  };

  const isInitiator = currentUser?.id === exchange?.initiatorId;
  const isResponder = currentUser?.id === exchange?.responderId;
  const hasSigned = isInitiator ? agreement?.initiatorSignature : agreement?.responderSignature;
  const isEffective = agreement?.initiatorSignature && agreement?.responderSignature;

  const getItemImage = (item: Item | null): string => {
    if (item?.images?.[0]) return item.images[0];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.title || '物品')}&background=FF6B35&color=fff&size=400`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!agreement || !exchange) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-text-secondary">协议不存在</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-primary-500" />
          <h1 className="text-2xl font-bold text-text-primary">物品交换协议</h1>
        </div>

        <div className="bg-surface rounded-card shadow-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">协议状态</h2>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2',
                isEffective
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              )}
            >
              {isEffective ? (
                <><Shield className="w-4 h-4" /> 已生效</>
              ) : (
                <><Clock className="w-4 h-4" /> 待签署</>
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-text-muted" />
                <span className="text-sm text-text-secondary">发起方</span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={initiator?.avatar}
                  alt={initiator?.username}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-text-primary">{initiator?.username}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {agreement.initiatorSignature ? (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <Check className="w-4 h-4" /> 已签署
                      </span>
                    ) : (
                      <span className="text-text-muted text-sm">未签署</span>
                    )}
                  </div>
                </div>
              </div>
              {agreement.initiatorSignedAt && (
                <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(agreement.initiatorSignedAt)}
                </p>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-text-muted" />
                <span className="text-sm text-text-secondary">响应方</span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={responder?.avatar}
                  alt={responder?.username}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-text-primary">{responder?.username}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {agreement.responderSignature ? (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <Check className="w-4 h-4" /> 已签署
                      </span>
                    ) : (
                      <span className="text-text-muted text-sm">未签署</span>
                    )}
                  </div>
                </div>
              </div>
              {agreement.responderSignedAt && (
                <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(agreement.responderSignedAt)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-card shadow-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">交换物品</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                <img
                  src={getItemImage(initiatorItem)}
                  alt={initiatorItem?.title || '物品'}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-medium text-text-primary text-center">
                {initiatorItem?.title || '物品'}
              </h3>
              <p className="text-sm text-text-secondary text-center mt-1">
                {isInitiator ? '我的物品' : '对方物品'}
              </p>
            </div>

            <div className="flex-shrink-0">
              <Package className="w-8 h-8 text-text-muted" />
            </div>

            <div className="flex-1">
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                <img
                  src={getItemImage(responderItem)}
                  alt={responderItem?.title || '物品'}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-medium text-text-primary text-center">
                {responderItem?.title || '物品'}
              </h3>
              <p className="text-sm text-text-secondary text-center mt-1">
                {isResponder ? '我的物品' : '对方物品'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-card shadow-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">协议内容</h2>
          <div className="p-4 bg-gray-50 rounded-lg space-y-4 text-text-primary">
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                交换日期
              </h3>
              <p className="text-sm">协议创建时间：{formatDateTime(agreement.createdAt)}</p>
              {isEffective && agreement.effectiveAt && (
                <p className="text-sm">协议生效时间：{formatDateTime(agreement.effectiveAt)}</p>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" />
                双方信息
              </h3>
              <p className="text-sm">发起方：{initiator?.username}，联系电话：{initiator?.phone}</p>
              <p className="text-sm">响应方：{responder?.username}，联系电话：{responder?.phone}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-500" />
                物品信息
              </h3>
              <p className="text-sm">
                发起方物品：{initiatorItem?.title}
                {initiatorItem && `（${initiatorItem.condition}，价值 ¥${initiatorItem.price}）`}
              </p>
              <p className="text-sm">
                响应方物品：{responderItem?.title}
                {responderItem && `（${responderItem.condition}，价值 ¥${responderItem.price}）`}
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                免责条款
              </h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-text-secondary">
                <li>双方确认物品信息真实有效，不存在隐瞒瑕疵或虚假描述</li>
                <li>物品交换后，如发现质量问题，双方友好协商解决</li>
                <li>物流过程中物品损坏或丢失，由承运方承担责任</li>
                <li>本协议一经签署，即具有法律效力，双方应严格遵守</li>
                <li>如有争议，双方可通过平台调解或法律途径解决</li>
              </ul>
            </div>
          </div>
        </div>

        {!isEffective && (isInitiator || isResponder) && !hasSigned && (
          <button
            onClick={handleSign}
            disabled={signLoading}
            className="w-full py-4 bg-primary-500 text-white rounded-button font-medium hover:bg-primary-600 transition-all shadow-button flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {signLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            确认签署协议
          </button>
        )}

        {isEffective && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
              <Shield className="w-5 h-5" />
              协议已生效，双方已完成签署
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
